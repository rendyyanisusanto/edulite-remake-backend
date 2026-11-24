const { Op } = require('sequelize');
const db = require('../../models');
const {
    AcademicYear,
    Class,
    Grade,
    Department,
    Teacher,
    User,
    Subject,
    LessonPeriodTemplate,
    LessonPeriod,
    Student,
    StudentClassHistory,
    SchoolProfile,
    LessonAttendanceSession,
    LessonAttendanceDetail
} = db;
const qrService = require('./lesson-attendance-qr.service');
const pinService = require('./lesson-attendance-pin.service');
const auditService = require('./lesson-attendance-audit.service');
const {
    issueAttendanceToken,
    pinVerifyPairLimiter,
    pinVerifyIpLimiter,
    pinVerifyTeacherLimiter
} = require('./lesson-attendance.auth');
const {
    AUDIT_ACTIONS,
    ATTENDANCE_STATUSES,
    INPUT_METHODS,
    ERROR_CODES,
    DEFAULT_TIMEZONE,
    AppError
} = require('./lesson-attendance.constants');
const logger = require('../../core/logger');

class LessonAttendanceService {
    getServerDateTimeInTimezone(timezone = DEFAULT_TIMEZONE, date = new Date()) {
        const dateParts = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(date);

        const timeParts = new Intl.DateTimeFormat('en-GB', {
            timeZone: timezone,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).formatToParts(date);

        const getPart = (parts, type) => parts.find((p) => p.type === type)?.value || '00';
        const attendanceDate = `${getPart(dateParts, 'year')}-${getPart(dateParts, 'month')}-${getPart(dateParts, 'day')}`;
        const currentTime = `${getPart(timeParts, 'hour')}:${getPart(timeParts, 'minute')}:${getPart(timeParts, 'second')}`;

        return { attendanceDate, currentTime, timezone };
    }

    async getSchoolProfileMinimal() {
        const profile = await SchoolProfile.findOne({
            attributes: ['name', 'short_name', 'logo', 'logo_light']
        });
        return profile ? {
            name: profile.name,
            short_name: profile.short_name,
            logo: profile.logo || profile.logo_light || null
        } : null;
    }

    async getActiveAcademicYear({ attendanceDate = null, transaction = null } = {}) {
        const years = await AcademicYear.findAll({
            where: { is_active: true },
            order: [['id', 'ASC']],
            transaction
        });

        if (years.length === 0) {
            logger.error('No active academic year configured', {
                module: 'lesson-attendance',
                operation: 'getActiveAcademicYear',
                error_code: ERROR_CODES.ACTIVE_ACADEMIC_YEAR_NOT_FOUND
            });
            throw new AppError(
                'Tahun ajaran aktif belum dikonfigurasi dengan benar. Silakan hubungi administrator sekolah.',
                409,
                ERROR_CODES.ACTIVE_ACADEMIC_YEAR_NOT_FOUND
            );
        }

        if (years.length > 1) {
            logger.error('Multiple active academic years configured', {
                module: 'lesson-attendance',
                operation: 'getActiveAcademicYear',
                active_year_ids: years.map((y) => y.id),
                error_code: ERROR_CODES.INVALID_ACADEMIC_YEAR_CONFIGURATION
            });
            throw new AppError(
                'Tahun ajaran aktif belum dikonfigurasi dengan benar. Silakan hubungi administrator sekolah.',
                409,
                ERROR_CODES.INVALID_ACADEMIC_YEAR_CONFIGURATION
            );
        }

        const year = years[0];
        const checkDate = attendanceDate || this.getServerDateTimeInTimezone().attendanceDate;
        if (
            (year.start_date && checkDate < year.start_date) ||
            (year.end_date && checkDate > year.end_date)
        ) {
            logger.error('Attendance date is outside active academic year period', {
                module: 'lesson-attendance',
                operation: 'getActiveAcademicYear',
                academic_year_id: year.id,
                attendance_date: checkDate,
                start_date: year.start_date,
                end_date: year.end_date,
                error_code: ERROR_CODES.INVALID_ACADEMIC_YEAR_CONFIGURATION
            });
            throw new AppError(
                'Tahun ajaran aktif belum dikonfigurasi dengan benar. Silakan hubungi administrator sekolah.',
                409,
                ERROR_CODES.INVALID_ACADEMIC_YEAR_CONFIGURATION
            );
        }

        return year;
    }

    async getActiveTeachersMinimal() {
        const teachers = await Teacher.findAll({
            attributes: ['id', 'full_name', 'nip', 'position'],
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'is_active'],
                required: false
            }],
            order: [['full_name', 'ASC']]
        });

        return teachers
            .filter((t) => !t.user || t.user.is_active !== false)
            .map((t) => ({
                id: t.id,
                full_name: t.full_name,
                nip: t.nip || null,
                position: t.position || null
            }));
    }

    async resolvePublicQr(token) {
        const { cls, activeAcademicYear } = await qrService.resolveClassByToken(token);
        const [schoolProfile, teachers] = await Promise.all([
            this.getSchoolProfileMinimal(),
            this.getActiveTeachersMinimal()
        ]);

        return {
            valid: true,
            class_info: {
                id: cls.id,
                name: cls.name,
                grade: cls.grade ? { id: cls.grade.id, name: cls.grade.name, level: cls.grade.level } : null,
                department: cls.department ? { id: cls.department.id, name: cls.department.name, code: cls.department.code } : null
            },
            academic_year: {
                id: activeAcademicYear.id,
                name: activeAcademicYear.name
            },
            school: schoolProfile,
            teachers
        };
    }

    async getPublicTeachersByQr(token) {
        await qrService.resolveClassByToken(token);
        return this.getActiveTeachersMinimal();
    }

    async verifyTeacherPinByQr(token, teacherId, pin, ipAddress) {
        const pairKey = `pin_pair:${ipAddress}:${teacherId}`;
        const ipKey = `pin_ip:${ipAddress}`;
        const teacherKey = `pin_teacher:${teacherId}`;

        if (
            pinVerifyPairLimiter.isLimited(pairKey) ||
            pinVerifyIpLimiter.isLimited(ipKey) ||
            pinVerifyTeacherLimiter.isLimited(teacherKey)
        ) {
            throw new AppError(
                'Terlalu banyak percobaan PIN gagal. Silakan coba lagi setelah 15 menit.',
                429,
                ERROR_CODES.PIN_RATE_LIMITED
            );
        }

        const { cls, activeAcademicYear } = await qrService.resolveClassByToken(token);
        const verification = await pinService.verifyPinForTeacher(teacherId, pin);

        if (!verification.valid) {
            pinVerifyPairLimiter.record(pairKey);
            pinVerifyIpLimiter.record(ipKey);
            pinVerifyTeacherLimiter.record(teacherKey);

            logger.warn('Failed lesson attendance PIN verification', {
                module: 'lesson-attendance',
                operation: 'verifyTeacherPinByQr',
                teacher_id: Number(teacherId),
                class_id: cls.id,
                reason: verification.reason,
                ip_address: ipAddress
            });

            throw new AppError(
                'Guru atau PIN presensi tidak valid.',
                401,
                ERROR_CODES.INVALID_ATTENDANCE_CREDENTIALS
            );
        }

        pinVerifyPairLimiter.reset(pairKey);

        const tokenPayload = issueAttendanceToken({
            teacherId: verification.teacher.id,
            classId: cls.id,
            academicYearId: activeAcademicYear.id,
            pinHash: verification.teacher.attendance_pin_hash,
            classToken: cls.attendance_token
        });

        return {
            ...tokenPayload,
            teacher: {
                id: verification.teacher.id,
                full_name: verification.teacher.full_name,
                nip: verification.teacher.nip
            },
            class_info: {
                id: cls.id,
                name: cls.name
            },
            academic_year: {
                id: activeAcademicYear.id,
                name: activeAcademicYear.name
            }
        };
    }

    async getActiveLessonPeriodTemplate() {
        let template = await LessonPeriodTemplate.findOne({
            where: { is_active: true, is_default: true },
            order: [['id', 'ASC']]
        });
        if (!template) {
            template = await LessonPeriodTemplate.findOne({
                where: { is_active: true },
                order: [['id', 'ASC']]
            });
        }
        return template;
    }

    async getAvailableLessonPeriods(currentTimeStr = null) {
        const template = await this.getActiveLessonPeriodTemplate();
        if (!template) {
            logger.error('No active lesson period template found', {
                module: 'lesson-attendance',
                operation: 'getAvailableLessonPeriods',
                error_code: ERROR_CODES.LESSON_PERIOD_TEMPLATE_NOT_FOUND
            });
            throw new AppError(
                'Template jam pelajaran aktif belum dikonfigurasi. Silakan hubungi administrator sekolah.',
                409,
                ERROR_CODES.LESSON_PERIOD_TEMPLATE_NOT_FOUND
            );
        }

        const periods = await LessonPeriod.findAll({
            where: {
                template_id: template.id,
                is_active: true,
                is_attendance_enabled: true,
                period_number: {
                    [Op.and]: [
                        { [Op.ne]: null },
                        { [Op.gt]: 0 }
                    ]
                }
            },
            attributes: [
                'id', 'template_id', 'period_order', 'period_number',
                'name', 'period_type', 'start_time', 'end_time',
                'is_attendance_enabled', 'is_active'
            ],
            order: [['period_order', 'ASC'], ['period_number', 'ASC']]
        });

        const nowTime = currentTimeStr || this.getServerDateTimeInTimezone().currentTime;
        const currentPeriod = periods.find(
            (p) => p.start_time <= nowTime && nowTime < p.end_time
        ) || null;

        return {
            template: {
                id: template.id,
                name: template.name,
                code: template.code
            },
            periods,
            current_period: currentPeriod
        };
    }

    async validateLessonPeriodsForSubmission(lessonPeriodIds, { allowFuture = false, currentTimeStr = null, transaction = null } = {}) {
        if (!Array.isArray(lessonPeriodIds) || lessonPeriodIds.length === 0) {
            throw new AppError('Pilih minimal satu jam pelajaran.', 422, ERROR_CODES.INVALID_LESSON_PERIOD);
        }

        const uniqueIds = [...new Set(lessonPeriodIds.map((id) => Number(id)))];
        if (uniqueIds.length !== lessonPeriodIds.length || uniqueIds.some((id) => !Number.isInteger(id) || id <= 0)) {
            throw new AppError('Daftar jam pelajaran mengandung ID duplikat atau tidak valid.', 422, ERROR_CODES.INVALID_LESSON_PERIOD);
        }

        const template = await this.getActiveLessonPeriodTemplate();
        if (!template) {
            throw new AppError('Template jam pelajaran aktif belum tersedia.', 409, ERROR_CODES.LESSON_PERIOD_TEMPLATE_NOT_FOUND);
        }

        const periods = await LessonPeriod.findAll({
            where: {
                id: { [Op.in]: uniqueIds },
                template_id: template.id
            },
            transaction
        });

        if (periods.length !== uniqueIds.length) {
            throw new AppError('Sebagian jam pelajaran tidak ditemukan pada template aktif.', 422, ERROR_CODES.INVALID_LESSON_PERIOD);
        }

        const nowTime = currentTimeStr || this.getServerDateTimeInTimezone().currentTime;
        for (const period of periods) {
            if (
                !period.is_active ||
                !period.is_attendance_enabled ||
                period.period_number === null ||
                Number(period.period_number) <= 0
            ) {
                throw new AppError(
                    `Jam pelajaran "${period.name}" tidak aktif atau tidak mengizinkan presensi.`,
                    422,
                    ERROR_CODES.INVALID_LESSON_PERIOD
                );
            }
            if (!allowFuture && period.start_time > nowTime) {
                throw new AppError(
                    `Jam pelajaran "${period.name}" belum dimulai dan belum dapat dicatat sebagai presensi final.`,
                    422,
                    ERROR_CODES.FUTURE_LESSON_PERIOD_NOT_ALLOWED
                );
            }
        }

        return periods.sort((a, b) => a.period_order - b.period_order);
    }

    /**
     * Reusable active class roster service.
     * Resolves the latest student_class_history assignment per (student_id, academic_year_id)
     * BEFORE filtering by class_id, ensuring transferred students only appear in their latest class.
     */
    async getActiveClassRoster({ classId, academicYearId, transaction = null }) {
        const numericClassId = Number(classId);
        const numericAcademicYearId = Number(academicYearId);

        const sql = `
            WITH ranked_class_history AS (
                SELECT
                    sch.id,
                    sch.student_id,
                    sch.academic_year_id,
                    sch.grade_id,
                    sch.class_id,
                    sch.created_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY
                            sch.student_id,
                            sch.academic_year_id
                        ORDER BY
                            sch.created_at DESC,
                            sch.id DESC
                    ) AS row_num
                FROM student_class_history sch
                WHERE sch.academic_year_id = :academic_year_id
            )
            SELECT
                s.id AS student_id,
                s.nis,
                s.full_name
            FROM ranked_class_history rch
            INNER JOIN students s
                ON s.id = rch.student_id
            WHERE rch.row_num = 1
                AND rch.class_id = :class_id
                AND s.student_status = 'ACTIVE'
            ORDER BY
                s.full_name ASC,
                s.id ASC
        `;

        const rows = await db.sequelize.query(sql, {
            replacements: {
                academic_year_id: numericAcademicYearId,
                class_id: numericClassId
            },
            type: db.Sequelize.QueryTypes.SELECT,
            transaction
        });

        const students = rows.map((row) => ({
            student_id: Number(row.student_id),
            nis: row.nis || null,
            full_name: row.full_name
        }));

        return {
            class_id: numericClassId,
            academic_year_id: numericAcademicYearId,
            total_students: students.length,
            students
        };
    }

    async getStudentRosterForClass(classId, academicYearId, transaction = null) {
        const result = await this.getActiveClassRoster({ classId, academicYearId, transaction });
        return result.students;
    }

    async getSubjectsLookup() {
        return Subject.findAll({
            where: { is_active: true },
            attributes: ['id', 'code', 'name', 'subject_type', 'department_id'],
            order: [['name', 'ASC']]
        });
    }

    async getContext(attendanceAuth) {
        const { teacher, classInfo, academicYear } = attendanceAuth;
        const { attendanceDate, currentTime, timezone } = this.getServerDateTimeInTimezone();

        const [clsDetail, periodInfo, subjects, rosterResult, existingSessions] = await Promise.all([
            Class.findByPk(classInfo.id, {
                attributes: ['id', 'name', 'grade_id', 'department_id'],
                include: [
                    { model: Grade, as: 'grade', attributes: ['id', 'name', 'level'] },
                    { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
                ]
            }),
            this.getAvailableLessonPeriods(currentTime),
            this.getSubjectsLookup(),
            this.getActiveClassRoster({
                classId: classInfo.id,
                academicYearId: academicYear.id
            }),
            LessonAttendanceSession.findAll({
                where: {
                    academic_year_id: academicYear.id,
                    class_id: classInfo.id,
                    attendance_date: attendanceDate
                },
                attributes: ['id', 'lesson_period_id', 'period_number', 'subject_id', 'teacher_id', 'cancelled_at'],
                order: [['period_number', 'ASC']]
            })
        ]);

        const sessionByPeriodNumber = new Map();
        const sessionByPeriodId = new Map();
        for (const sess of existingSessions) {
            sessionByPeriodNumber.set(Number(sess.period_number), sess);
            sessionByPeriodId.set(Number(sess.lesson_period_id), sess);
        }

        const currentPeriodId = periodInfo.current_period ? periodInfo.current_period.id : null;
        const enrichedPeriods = periodInfo.periods.map((p) => {
            const plain = p.get ? p.get({ plain: true }) : p;
            const existing = sessionByPeriodNumber.get(Number(plain.period_number)) || sessionByPeriodId.get(Number(plain.id));
            let attendanceState = 'AVAILABLE';
            if (existing) {
                attendanceState = existing.cancelled_at ? 'CANCELLED' : 'ALREADY_SUBMITTED';
            }
            return {
                ...plain,
                attendance_state: attendanceState,
                is_current: currentPeriodId === plain.id,
                is_future: plain.start_time > currentTime
            };
        });

        return {
            teacher,
            class_info: clsDetail || classInfo,
            academic_year: {
                id: academicYear.id,
                name: academicYear.name
            },
            attendance_date: attendanceDate,
            current_time: currentTime,
            timezone,
            current_period_id: currentPeriodId,
            lesson_period_template: periodInfo.template,
            available_lesson_periods: enrichedPeriods,
            current_lesson_period: periodInfo.current_period,
            subjects,
            students: rosterResult.students,
            student_roster: rosterResult.students,
            total_students: rosterResult.total_students,
            existing_sessions: existingSessions.map((s) => ({
                id: String(s.id),
                lesson_period_id: s.lesson_period_id,
                period_number: s.period_number,
                subject_id: s.subject_id,
                teacher_id: s.teacher_id,
                cancelled_at: s.cancelled_at
            }))
        };
    }

    _buildAttendanceSummary(students) {
        const summary = {
            HADIR: 0,
            TERLAMBAT: 0,
            IZIN: 0,
            SAKIT: 0,
            ALPA: 0
        };
        for (const item of students) {
            if (Object.prototype.hasOwnProperty.call(summary, item.status)) {
                summary[item.status] += 1;
            }
        }
        return summary;
    }

    async submitPublicAttendance({
        attendanceAuth,
        subjectId,
        lessonPeriodIds,
        students,
        notes = null,
        ipAddress = null
    }) {
        const teacherId = Number(attendanceAuth.teacher.id);
        const classId = Number(attendanceAuth.classInfo.id);
        const tokenAcademicYearId = Number(attendanceAuth.academicYear.id);
        const { attendanceDate, currentTime } = this.getServerDateTimeInTimezone();

        if (!Array.isArray(students) || students.length === 0) {
            throw new AppError('Data presensi siswa wajib diisi.', 422, ERROR_CODES.INVALID_STUDENT_ROSTER);
        }

        const seenStudents = new Set();
        const normalizedStudents = [];
        for (const item of students) {
            const sid = Number(item.student_id);
            if (!Number.isInteger(sid) || sid <= 0) {
                throw new AppError('Terdapat ID siswa tidak valid.', 422, ERROR_CODES.INVALID_STUDENT_ROSTER);
            }
            if (seenStudents.has(sid)) {
                throw new AppError(`Siswa dengan ID ${sid} tercatat ganda dalam pengajuan.`, 422, ERROR_CODES.INVALID_STUDENT_ROSTER);
            }
            if (!ATTENDANCE_STATUSES.includes(item.status)) {
                throw new AppError(`Status presensi "${item.status}" tidak valid.`, 400, ERROR_CODES.VALIDATION_ERROR);
            }
            seenStudents.add(sid);
            normalizedStudents.push({
                student_id: sid,
                status: item.status,
                notes: item.notes ? String(item.notes).trim().slice(0, 500) : null
            });
        }

        try {
            const result = await db.sequelize.transaction(async (transaction) => {
                const activeAcademicYear = await this.getActiveAcademicYear({ attendanceDate, transaction });
                if (Number(activeAcademicYear.id) !== tokenAcademicYearId) {
                    throw new AppError(
                        'Tahun ajaran aktif telah berubah. Silakan scan ulang QR kelas.',
                        401,
                        ERROR_CODES.ATTENDANCE_TOKEN_INVALID
                    );
                }

                const [teacher, cls] = await Promise.all([
                    Teacher.scope('withPinHash').findByPk(teacherId, {
                        attributes: ['id', 'user_id', 'full_name', 'attendance_pin_hash'],
                        include: [{ model: User, as: 'user', attributes: ['id', 'is_active'], required: false }],
                        transaction
                    }),
                    Class.scope('withAttendanceToken').findByPk(classId, {
                        attributes: ['id', 'name', 'attendance_token', 'attendance_qr_active'],
                        transaction
                    })
                ]);

                if (!teacher || (teacher.user && teacher.user.is_active === false) || !teacher.attendance_pin_hash) {
                    throw new AppError(
                        'Sesi presensi guru tidak lagi berlaku. Silakan verifikasi ulang.',
                        401,
                        ERROR_CODES.ATTENDANCE_TOKEN_INVALID
                    );
                }
                if (!cls || !cls.attendance_token || !cls.attendance_qr_active) {
                    throw new AppError(
                        'QR Code kelas tidak aktif atau telah diperbarui.',
                        403,
                        ERROR_CODES.ATTENDANCE_QR_INACTIVE
                    );
                }

                const subject = await Subject.findOne({
                    where: { id: Number(subjectId), is_active: true },
                    attributes: ['id', 'name', 'code'],
                    transaction
                });
                if (!subject) {
                    throw new AppError('Mata pelajaran tidak ditemukan atau tidak aktif.', 422, ERROR_CODES.SUBJECT_NOT_FOUND);
                }

                const periods = await this.validateLessonPeriodsForSubmission(lessonPeriodIds, {
                    allowFuture: true,
                    currentTimeStr: currentTime,
                    transaction
                });

                const rosterResult = await this.getActiveClassRoster({
                    classId,
                    academicYearId: activeAcademicYear.id,
                    transaction
                });

                if (rosterResult.total_students === 0) {
                    throw new AppError(
                        'Tidak ada siswa aktif yang terdaftar pada kelas ini untuk tahun ajaran berjalan. Silakan hubungi administrator sekolah.',
                        422,
                        ERROR_CODES.EMPTY_STUDENT_ROSTER
                    );
                }

                const dbStudentIds = new Set(rosterResult.students.map((s) => s.student_id));
                const rosterMismatch =
                    dbStudentIds.size !== seenStudents.size ||
                    rosterResult.students.some((s) => !seenStudents.has(s.student_id)) ||
                    normalizedStudents.some((s) => !dbStudentIds.has(s.student_id));

                if (rosterMismatch) {
                    throw new AppError(
                        'Daftar siswa kelas ini telah berubah. Silakan perbarui daftar siswa sebelum menyimpan presensi.',
                        409,
                        ERROR_CODES.ATTENDANCE_ROSTER_CHANGED
                    );
                }

                const periodNumbers = periods.map((p) => p.period_number);
                const periodIds = periods.map((p) => p.id);
                const existingSessions = await LessonAttendanceSession.findAll({
                    where: {
                        academic_year_id: activeAcademicYear.id,
                        class_id: classId,
                        attendance_date: attendanceDate,
                        [Op.or]: [
                            { period_number: { [Op.in]: periodNumbers } },
                            { lesson_period_id: { [Op.in]: periodIds } }
                        ]
                    },
                    attributes: ['id', 'period_number', 'cancelled_at'],
                    transaction
                });

                if (existingSessions.length > 0) {
                    const conflictNums = [...new Set(existingSessions.map((s) => s.period_number))].sort((a, b) => a - b);
                    throw new AppError(
                        `Presensi untuk jam ke-${conflictNums.join(', ')} sudah tercatat pada tanggal hari ini.`,
                        409,
                        ERROR_CODES.ATTENDANCE_ALREADY_EXISTS
                    );
                }

                const summary = this._buildAttendanceSummary(normalizedStudents);
                const createdSessions = [];

                for (const period of periods) {
                    const session = await LessonAttendanceSession.create({
                        academic_year_id: activeAcademicYear.id,
                        class_id: classId,
                        teacher_id: teacherId,
                        subject_id: subject.id,
                        lesson_period_id: period.id,
                        attendance_date: attendanceDate,
                        period_number: period.period_number,
                        period_start_time: period.start_time,
                        period_end_time: period.end_time,
                        notes: notes ? String(notes).trim().slice(0, 1000) : null,
                        input_method: INPUT_METHODS.QR,
                        cancelled_at: null
                    }, { transaction });

                    const detailRecords = normalizedStudents.map((d) => ({
                        session_id: session.id,
                        student_id: d.student_id,
                        status: d.status,
                        notes: d.notes
                    }));

                    await LessonAttendanceDetail.bulkCreate(detailRecords, { transaction });

                    await auditService.record({
                        sessionId: session.id,
                        teacherId,
                        userId: null,
                        action: AUDIT_ACTIONS.ATTENDANCE_SUBMITTED,
                        oldData: null,
                        newData: {
                            academic_year_id: activeAcademicYear.id,
                            class_id: classId,
                            subject_id: subject.id,
                            lesson_period_id: period.id,
                            period_number: period.period_number,
                            attendance_date: attendanceDate,
                            input_method: INPUT_METHODS.QR,
                            total_students: detailRecords.length,
                            summary
                        },
                        description: `Presensi jam ke-${period.period_number} disimpan melalui QR kelas.`,
                        ipAddress,
                        transaction
                    });

                    createdSessions.push(session);
                }

                return {
                    class_name: cls.name,
                    teacher_name: teacher.full_name,
                    subject_name: subject.name,
                    attendance_date: attendanceDate,
                    submitted_at: new Date().toISOString(),
                    total_sessions: createdSessions.length,
                    total_students: normalizedStudents.length,
                    total_details: createdSessions.length * normalizedStudents.length,
                    periods: createdSessions.map((s) => ({
                        session_id: String(s.id),
                        period_number: s.period_number
                    })),
                    summary
                };
            });

            return result;
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                logger.warn('Unique constraint conflict during public lesson attendance submit', {
                    module: 'lesson-attendance',
                    operation: 'submitPublicAttendance',
                    teacher_id: teacherId,
                    class_id: classId,
                    academic_year_id: tokenAcademicYearId,
                    error_code: ERROR_CODES.ATTENDANCE_ALREADY_EXISTS
                });
                throw new AppError(
                    'Presensi untuk kelas dan jam pelajaran ini pada tanggal hari ini sudah tercatat.',
                    409,
                    ERROR_CODES.ATTENDANCE_ALREADY_EXISTS
                );
            }
            throw error;
        }
    }

    async submitAttendanceSessions({
        teacherId,
        classId,
        academicYearId,
        subjectId,
        lessonPeriodIds,
        details,
        notes = null,
        inputMethod = INPUT_METHODS.QR,
        actorUserId = null,
        ipAddress = null,
        allowFuture = false
    }) {
        const subject = await Subject.findOne({ where: { id: subjectId, is_active: true } });
        if (!subject) {
            throw new AppError('Mata pelajaran tidak ditemukan atau tidak aktif.', 422, ERROR_CODES.SUBJECT_NOT_FOUND);
        }

        const { attendanceDate, currentTime } = this.getServerDateTimeInTimezone();
        const periods = await this.validateLessonPeriodsForSubmission(lessonPeriodIds, {
            allowFuture,
            currentTimeStr: currentTime
        });

        const rosterResult = await this.getActiveClassRoster({ classId, academicYearId });
        if (rosterResult.total_students === 0) {
            throw new AppError(
                'Tidak ada siswa aktif yang terdaftar pada kelas ini untuk tahun ajaran berjalan.',
                422,
                ERROR_CODES.EMPTY_STUDENT_ROSTER
            );
        }
        const validStudentIds = new Set(rosterResult.students.map((s) => s.student_id));

        if (!Array.isArray(details) || details.length === 0) {
            throw new AppError('Data presensi siswa wajib diisi.', 422, ERROR_CODES.INVALID_STUDENT_ROSTER);
        }

        const seenStudents = new Set();
        for (const item of details) {
            const sid = Number(item.student_id);
            if (!validStudentIds.has(sid)) {
                throw new AppError(`Siswa dengan ID ${sid} tidak terdaftar pada rombel kelas ini.`, 422, ERROR_CODES.INVALID_STUDENT_ROSTER);
            }
            if (seenStudents.has(sid)) {
                throw new AppError(`Siswa dengan ID ${sid} tercatat ganda dalam pengajuan.`, 422, ERROR_CODES.INVALID_STUDENT_ROSTER);
            }
            if (!ATTENDANCE_STATUSES.includes(item.status)) {
                throw new AppError(`Status presensi "${item.status}" tidak valid.`, 400, ERROR_CODES.VALIDATION_ERROR);
            }
            seenStudents.add(sid);
        }

        if (seenStudents.size !== validStudentIds.size) {
            throw new AppError(
                'Daftar siswa kelas ini telah berubah. Silakan perbarui daftar siswa sebelum menyimpan presensi.',
                409,
                ERROR_CODES.ATTENDANCE_ROSTER_CHANGED
            );
        }

        try {
            return await db.sequelize.transaction(async (transaction) => {
                const createdSessions = [];

                for (const period of periods) {
                    const session = await LessonAttendanceSession.create({
                        academic_year_id: academicYearId,
                        class_id: classId,
                        teacher_id: teacherId,
                        subject_id: subjectId,
                        lesson_period_id: period.id,
                        attendance_date: attendanceDate,
                        period_number: period.period_number,
                        period_start_time: period.start_time,
                        period_end_time: period.end_time,
                        notes: notes || null,
                        input_method: inputMethod
                    }, { transaction });

                    const detailRecords = details.map((d) => ({
                        session_id: session.id,
                        student_id: Number(d.student_id),
                        status: d.status,
                        notes: d.notes || null
                    }));

                    await LessonAttendanceDetail.bulkCreate(detailRecords, { transaction });

                    await auditService.record({
                        sessionId: session.id,
                        teacherId,
                        userId: actorUserId,
                        action: AUDIT_ACTIONS.ATTENDANCE_SUBMITTED,
                        newData: {
                            academic_year_id: academicYearId,
                            class_id: classId,
                            subject_id: subjectId,
                            lesson_period_id: period.id,
                            period_number: period.period_number,
                            attendance_date: attendanceDate,
                            total_students: detailRecords.length,
                            input_method: inputMethod,
                            summary: this._buildAttendanceSummary(details)
                        },
                        description: `Presensi jam ke-${period.period_number} disimpan.`,
                        ipAddress,
                        transaction
                    });

                    createdSessions.push(session);
                }

                return createdSessions;
            });
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new AppError(
                    'Presensi untuk kelas dan jam pelajaran ini pada tanggal hari ini sudah tercatat.',
                    409,
                    ERROR_CODES.ATTENDANCE_ALREADY_EXISTS
                );
            }
            throw error;
        }
    }
}

module.exports = new LessonAttendanceService();
