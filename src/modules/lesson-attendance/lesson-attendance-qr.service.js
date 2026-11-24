const crypto = require('crypto');
const db = require('../../models');
const { Class, Grade, Department, AcademicYear } = db;
const auditService = require('./lesson-attendance-audit.service');
const { AUDIT_ACTIONS, ERROR_CODES, DEFAULT_TIMEZONE, AppError } = require('./lesson-attendance.constants');
const logger = require('../../core/logger');

class LessonAttendanceQrService {
    getFrontendBaseUrl() {
        const raw = process.env.FRONTEND_PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
        return String(raw).replace(/\/+$/, '');
    }

    buildQrUrl(token) {
        if (!token) return null;
        return `${this.getFrontendBaseUrl()}/presensi-kelas/${token}`;
    }

    _generateSecureToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    async getClassQrStatus(classId) {
        const cls = await Class.scope('withAttendanceToken').findByPk(classId, {
            attributes: ['id', 'name', 'grade_id', 'department_id', 'attendance_token', 'attendance_qr_active'],
            include: [
                { model: Grade, as: 'grade', attributes: ['id', 'name', 'level'] },
                { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
            ]
        });

        if (!cls) {
            throw new AppError('Kelas tidak ditemukan.', 404, ERROR_CODES.CLASS_NOT_FOUND);
        }

        const isConfigured = Boolean(cls.attendance_token);
        return {
            class_id: cls.id,
            class_name: cls.name,
            grade: cls.grade || null,
            department: cls.department || null,
            is_configured: isConfigured,
            is_active: Boolean(cls.attendance_qr_active),
            qr_url: isConfigured ? this.buildQrUrl(cls.attendance_token) : null
        };
    }

    async generateClassQr(classId, actorUserId = null, ipAddress = null) {
        const token = this._generateSecureToken();

        const cls = await db.sequelize.transaction(async (transaction) => {
            const item = await Class.scope('withAttendanceToken').findByPk(classId, {
                attributes: ['id', 'name', 'attendance_token', 'attendance_qr_active'],
                include: [
                    { model: Grade, as: 'grade', attributes: ['id', 'name', 'level'] },
                    { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
                ],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!item) {
                throw new AppError('Kelas tidak ditemukan.', 404, ERROR_CODES.CLASS_NOT_FOUND);
            }
            if (item.attendance_token) {
                throw new AppError(
                    'QR Code kelas sudah tersedia. Gunakan generate ulang untuk mengganti token.',
                    409,
                    ERROR_CODES.VALIDATION_ERROR
                );
            }

            await item.update({
                attendance_token: token,
                attendance_qr_active: true
            }, { transaction });

            await auditService.record({
                userId: actorUserId,
                action: AUDIT_ACTIONS.CLASS_QR_GENERATED,
                oldData: { class_id: item.id, qr_configured: false, is_active: false },
                newData: { class_id: item.id, qr_configured: true, is_active: true },
                description: `QR Code presensi kelas ${item.name} berhasil dibuat.`,
                ipAddress,
                transaction
            });

            return item;
        });

        return {
            class_id: cls.id,
            class_name: cls.name,
            grade: cls.grade || null,
            department: cls.department || null,
            is_configured: true,
            is_active: true,
            qr_url: this.buildQrUrl(token)
        };
    }

    async regenerateClassQr(classId, actorUserId = null, ipAddress = null) {
        const token = this._generateSecureToken();

        const cls = await db.sequelize.transaction(async (transaction) => {
            const item = await Class.scope('withAttendanceToken').findByPk(classId, {
                attributes: ['id', 'name', 'attendance_token', 'attendance_qr_active'],
                include: [
                    { model: Grade, as: 'grade', attributes: ['id', 'name', 'level'] },
                    { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
                ],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!item) {
                throw new AppError('Kelas tidak ditemukan.', 404, ERROR_CODES.CLASS_NOT_FOUND);
            }

            const wasConfigured = Boolean(item.attendance_token);
            const wasActive = Boolean(item.attendance_qr_active);

            await item.update({
                attendance_token: token,
                attendance_qr_active: true
            }, { transaction });

            await auditService.record({
                userId: actorUserId,
                action: AUDIT_ACTIONS.CLASS_QR_REGENERATED,
                oldData: { class_id: item.id, qr_configured: wasConfigured, is_active: wasActive },
                newData: { class_id: item.id, qr_regenerated: true, is_active: true },
                description: `QR Code presensi kelas ${item.name} berhasil digenerate ulang.`,
                ipAddress,
                transaction
            });

            return item;
        });

        return {
            class_id: cls.id,
            class_name: cls.name,
            grade: cls.grade || null,
            department: cls.department || null,
            is_configured: true,
            is_active: true,
            qr_url: this.buildQrUrl(token)
        };
    }

    async updateClassQrStatus(classId, isActive, actorUserId = null, ipAddress = null) {
        const nextActive = Boolean(isActive);

        const cls = await db.sequelize.transaction(async (transaction) => {
            const item = await Class.scope('withAttendanceToken').findByPk(classId, {
                attributes: ['id', 'name', 'attendance_token', 'attendance_qr_active'],
                include: [
                    { model: Grade, as: 'grade', attributes: ['id', 'name', 'level'] },
                    { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
                ],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!item) {
                throw new AppError('Kelas tidak ditemukan.', 404, ERROR_CODES.CLASS_NOT_FOUND);
            }
            if (!item.attendance_token) {
                throw new AppError(
                    'QR Code kelas belum dibuat. Silakan generate QR Code terlebih dahulu.',
                    400,
                    ERROR_CODES.ATTENDANCE_QR_NOT_CONFIGURED
                );
            }

            const prevActive = Boolean(item.attendance_qr_active);
            await item.update({ attendance_qr_active: nextActive }, { transaction });

            await auditService.record({
                userId: actorUserId,
                action: nextActive ? AUDIT_ACTIONS.CLASS_QR_ACTIVATED : AUDIT_ACTIONS.CLASS_QR_DEACTIVATED,
                oldData: { class_id: item.id, is_active: prevActive },
                newData: { class_id: item.id, is_active: nextActive },
                description: nextActive
                    ? `QR Code presensi kelas ${item.name} diaktifkan.`
                    : `QR Code presensi kelas ${item.name} dinonaktifkan.`,
                ipAddress,
                transaction
            });

            return item;
        });

        return {
            class_id: cls.id,
            class_name: cls.name,
            grade: cls.grade || null,
            department: cls.department || null,
            is_configured: true,
            is_active: nextActive,
            qr_url: this.buildQrUrl(cls.attendance_token)
        };
    }

    async resolveClassByToken(token) {
        if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
            throw new AppError('QR Code presensi tidak valid.', 404, ERROR_CODES.INVALID_QR_TOKEN);
        }

        const cls = await Class.scope('withAttendanceToken').findOne({
            where: { attendance_token: token },
            attributes: ['id', 'name', 'grade_id', 'department_id', 'attendance_token', 'attendance_qr_active'],
            include: [
                { model: Grade, as: 'grade', attributes: ['id', 'name', 'level'] },
                { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
            ]
        });

        if (!cls) {
            throw new AppError('QR Code presensi tidak ditemukan atau sudah tidak berlaku.', 404, ERROR_CODES.INVALID_QR_TOKEN);
        }
        if (!cls.attendance_qr_active) {
            throw new AppError('QR Code presensi kelas sedang dinonaktifkan oleh admin.', 403, ERROR_CODES.ATTENDANCE_QR_INACTIVE);
        }

        const activeAcademicYears = await AcademicYear.findAll({
            where: { is_active: true },
            order: [['id', 'ASC']]
        });
        if (activeAcademicYears.length === 0) {
            logger.error('Active academic year not found during QR resolution', {
                module: 'lesson-attendance',
                operation: 'resolveClassByToken',
                class_id: cls.id,
                error_code: ERROR_CODES.ACTIVE_ACADEMIC_YEAR_NOT_FOUND
            });
            throw new AppError(
                'Tahun ajaran aktif belum dikonfigurasi dengan benar. Silakan hubungi administrator sekolah.',
                409,
                ERROR_CODES.ACTIVE_ACADEMIC_YEAR_NOT_FOUND
            );
        }
        if (activeAcademicYears.length > 1) {
            logger.error('Multiple active academic years detected during QR resolution', {
                module: 'lesson-attendance',
                operation: 'resolveClassByToken',
                class_id: cls.id,
                active_year_ids: activeAcademicYears.map((y) => y.id),
                error_code: ERROR_CODES.INVALID_ACADEMIC_YEAR_CONFIGURATION
            });
            throw new AppError(
                'Tahun ajaran aktif belum dikonfigurasi dengan benar. Silakan hubungi administrator sekolah.',
                409,
                ERROR_CODES.INVALID_ACADEMIC_YEAR_CONFIGURATION
            );
        }

        const activeAcademicYear = activeAcademicYears[0];
        const todayStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: DEFAULT_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());

        if (
            (activeAcademicYear.start_date && todayStr < activeAcademicYear.start_date) ||
            (activeAcademicYear.end_date && todayStr > activeAcademicYear.end_date)
        ) {
            logger.error('Server date outside active academic year range', {
                module: 'lesson-attendance',
                operation: 'resolveClassByToken',
                class_id: cls.id,
                academic_year_id: activeAcademicYear.id,
                today: todayStr,
                start_date: activeAcademicYear.start_date,
                end_date: activeAcademicYear.end_date,
                error_code: ERROR_CODES.INVALID_ACADEMIC_YEAR_CONFIGURATION
            });
            throw new AppError(
                'Tahun ajaran aktif belum dikonfigurasi dengan benar. Silakan hubungi administrator sekolah.',
                409,
                ERROR_CODES.INVALID_ACADEMIC_YEAR_CONFIGURATION
            );
        }

        return { cls, activeAcademicYear };
    }
}

module.exports = new LessonAttendanceQrService();
