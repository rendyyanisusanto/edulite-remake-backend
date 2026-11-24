const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../../models');
const { Teacher, User } = db;
const auditService = require('./lesson-attendance-audit.service');
const {
    AUDIT_ACTIONS,
    ERROR_CODES,
    WEAK_PINS,
    BCRYPT_ROUNDS,
    AppError
} = require('./lesson-attendance.constants');

class LessonAttendancePinService {
    validatePinFormat(pin, { rejectWeak = false } = {}) {
        if (typeof pin !== 'string' || !/^\d{6}$/.test(pin)) {
            throw new AppError(
                'PIN presensi harus berupa tepat 6 digit angka.',
                400,
                ERROR_CODES.INVALID_PIN_FORMAT
            );
        }
        if (rejectWeak && WEAK_PINS.has(pin)) {
            throw new AppError(
                'PIN terlalu mudah ditebak. Gunakan kombinasi 6 digit angka yang lebih aman.',
                400,
                ERROR_CODES.INVALID_PIN_FORMAT
            );
        }
    }

    _generateSecureSixDigitPin() {
        for (let i = 0; i < 10; i++) {
            const num = crypto.randomInt(0, 1000000);
            const pin = String(num).padStart(6, '0');
            if (!WEAK_PINS.has(pin)) {
                return pin;
            }
        }
        return String(crypto.randomInt(100000, 999999));
    }

    async getPinStatus(teacherId) {
        const teacher = await Teacher.scope('withPinHash').findByPk(teacherId, {
            attributes: ['id', 'full_name', 'nip', 'attendance_pin_hash']
        });
        if (!teacher) {
            throw new AppError('Guru tidak ditemukan.', 404, ERROR_CODES.TEACHER_NOT_FOUND);
        }

        return {
            teacher_id: teacher.id,
            full_name: teacher.full_name,
            nip: teacher.nip,
            attendance_pin_configured: Boolean(teacher.attendance_pin_hash)
        };
    }

    async generatePin(teacherId, actorUserId = null, ipAddress = null) {
        const pin = this._generateSecureSixDigitPin();
        const hash = await bcrypt.hash(pin, BCRYPT_ROUNDS);

        await db.sequelize.transaction(async (transaction) => {
            const teacher = await Teacher.scope('withPinHash').findByPk(teacherId, {
                attributes: ['id', 'full_name', 'attendance_pin_hash'],
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!teacher) {
                throw new AppError('Guru tidak ditemukan.', 404, ERROR_CODES.TEACHER_NOT_FOUND);
            }

            const wasConfigured = Boolean(teacher.attendance_pin_hash);
            await teacher.update({ attendance_pin_hash: hash }, { transaction });

            await auditService.record({
                teacherId: teacher.id,
                userId: actorUserId,
                action: wasConfigured ? AUDIT_ACTIONS.TEACHER_PIN_RESET : AUDIT_ACTIONS.TEACHER_PIN_GENERATED,
                oldData: { pin_configured: wasConfigured },
                newData: { pin_configured: true, pin_reset: wasConfigured },
                description: wasConfigured
                    ? 'PIN presensi guru berhasil direset secara otomatis.'
                    : 'PIN presensi guru berhasil dibuat secara otomatis.',
                ipAddress,
                transaction
            });
        });

        return {
            teacher_id: Number(teacherId),
            pin,
            attendance_pin_configured: true
        };
    }

    async setManualPin(teacherId, pin, actorUserId = null, ipAddress = null) {
        this.validatePinFormat(pin, { rejectWeak: true });
        const hash = await bcrypt.hash(pin, BCRYPT_ROUNDS);

        await db.sequelize.transaction(async (transaction) => {
            const teacher = await Teacher.scope('withPinHash').findByPk(teacherId, {
                attributes: ['id', 'full_name', 'attendance_pin_hash'],
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!teacher) {
                throw new AppError('Guru tidak ditemukan.', 404, ERROR_CODES.TEACHER_NOT_FOUND);
            }

            const wasConfigured = Boolean(teacher.attendance_pin_hash);
            await teacher.update({ attendance_pin_hash: hash }, { transaction });

            await auditService.record({
                teacherId: teacher.id,
                userId: actorUserId,
                action: wasConfigured ? AUDIT_ACTIONS.TEACHER_PIN_RESET : AUDIT_ACTIONS.TEACHER_PIN_SET,
                oldData: { pin_configured: wasConfigured },
                newData: { pin_configured: true, pin_reset: wasConfigured },
                description: wasConfigured
                    ? 'PIN presensi guru berhasil diubah secara manual.'
                    : 'PIN presensi guru berhasil diatur secara manual.',
                ipAddress,
                transaction
            });
        });

        return {
            teacher_id: Number(teacherId),
            attendance_pin_configured: true
        };
    }

    async removePin(teacherId, actorUserId = null, ipAddress = null) {
        await db.sequelize.transaction(async (transaction) => {
            const teacher = await Teacher.scope('withPinHash').findByPk(teacherId, {
                attributes: ['id', 'full_name', 'attendance_pin_hash'],
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!teacher) {
                throw new AppError('Guru tidak ditemukan.', 404, ERROR_CODES.TEACHER_NOT_FOUND);
            }

            const wasConfigured = Boolean(teacher.attendance_pin_hash);
            await teacher.update({ attendance_pin_hash: null }, { transaction });

            await auditService.record({
                teacherId: teacher.id,
                userId: actorUserId,
                action: AUDIT_ACTIONS.TEACHER_PIN_REMOVED,
                oldData: { pin_configured: wasConfigured },
                newData: { pin_configured: false },
                description: 'PIN presensi guru dihapus.',
                ipAddress,
                transaction
            });
        });

        return {
            teacher_id: Number(teacherId),
            attendance_pin_configured: false
        };
    }

    async verifyPinForTeacher(teacherId, pin) {
        if (typeof pin !== 'string' || !/^\d{6}$/.test(pin)) {
            return { valid: false, reason: ERROR_CODES.INVALID_PIN_FORMAT };
        }

        const teacher = await Teacher.scope('withPinHash').findByPk(teacherId, {
            attributes: ['id', 'user_id', 'full_name', 'nip', 'attendance_pin_hash'],
            include: [{ model: User, as: 'user', attributes: ['id', 'is_active'], required: false }]
        });

        if (!teacher) {
            return { valid: false, reason: ERROR_CODES.TEACHER_NOT_FOUND };
        }
        if (teacher.user && teacher.user.is_active === false) {
            return { valid: false, reason: ERROR_CODES.TEACHER_INACTIVE };
        }
        if (!teacher.attendance_pin_hash) {
            return { valid: false, reason: ERROR_CODES.ATTENDANCE_PIN_NOT_CONFIGURED };
        }

        const match = await bcrypt.compare(pin, teacher.attendance_pin_hash);
        if (!match) {
            return { valid: false, reason: ERROR_CODES.INVALID_ATTENDANCE_CREDENTIALS };
        }

        return { valid: true, teacher };
    }
}

module.exports = new LessonAttendancePinService();
