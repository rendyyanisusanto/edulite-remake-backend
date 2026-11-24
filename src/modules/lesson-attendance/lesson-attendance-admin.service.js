'use strict';

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
    LessonPeriod,
    Student,
    LessonAttendanceSession,
    LessonAttendanceDetail,
    LessonAttendanceLog
} = db;
const lessonAttendanceService = require('./lesson-attendance.service');
const auditService = require('./lesson-attendance-audit.service');
const {
    AUDIT_ACTIONS,
    ATTENDANCE_STATUSES,
    INPUT_METHODS,
    ERROR_CODES,
    AppError
} = require('./lesson-attendance.constants');
const logger = require('../../core/logger');

const SESSION_SORT_WHITELIST = {
    attendance_date: 's.attendance_date',
    created_at: 's.created_at',
    period_number: 's.period_number',
    class_name: 'c.name',
    teacher_name: 't.full_name',
    subject_name: 'sub.name',
    input_method: 's.input_method'
};

class LessonAttendanceAdminService {
    async getLookups({ academicYearId = null, gradeId = null, departmentId = null } = {}) {
        const [academicYears, grades, departments, teachers, subjects] = await Promise.all([
            AcademicYear.findAll({
                attributes: ['id', 'name', 'start_date', 'end_date', 'is_active'],
                order: [['is_active', 'DESC'], ['start_date', 'DESC'], ['id', 'DESC']]
            }),
            Grade.findAll({
                attributes: ['id', 'name', 'level'],
                order: [['level', 'ASC'], ['name', 'ASC']]
            }),
            Department.findAll({
                attributes: ['id', 'name', 'code'],
                order: [['name', 'ASC']]
            }),
            lessonAttendanceService.getActiveTeachersMinimal(),
            Subject.findAll({
                where: { is_active: true },
                attributes: ['id', 'code', 'name', 'subject_type', 'department_id'],
                order: [['name', 'ASC']]
            })
        ]);

        const classWhere = {};
        if (gradeId) classWhere.grade_id = Number(gradeId);
        if (departmentId) classWhere.department_id = Number(departmentId);

        const classes = await Class.findAll({
            where: classWhere,
            attributes: ['id', 'name', 'grade_id', 'department_id'],
            include: [
                { model: Grade, as: 'grade', attributes: ['id', 'name', 'level'] },
                { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
            ],
            order: [['name', 'ASC']]
        });

        let periodData = { template: null, periods: [] };
        try {
            periodData = await lessonAttendanceService.getAvailableLessonPeriods();
        } catch (err) {
            if (err.errorCode !== ERROR_CODES.LESSON_PERIOD_TEMPLATE_NOT_FOUND) {
                throw err;
            }
        }

        const activeAcademicYear = academicYears.find((y) => y.is_active) || null;
        const selectedYear = academicYearId
            ? academicYears.find((y) => Number(y.id) === Number(academicYearId)) || activeAcademicYear
            : activeAcademicYear;

        const { attendanceDate, currentTime, timezone } = lessonAttendanceService.getServerDateTimeInTimezone();

        return {
            academic_years: academicYears,
            active_academic_year: activeAcademicYear,
            selected_academic_year: selectedYear,
            grades,
            departments,
            classes,
            teachers,
            subjects,
            lesson_period_template: periodData.template,
            lesson_periods: periodData.periods,
            server_date: attendanceDate,
            server_time: currentTime,
            timezone
        };
    }

    async getStudentLookup({ search = '', academicYearId = null, limit = 30 } = {}) {
        const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
        const replacements = { limit: safeLimit };
        const conditions = [];

        if (search && String(search).trim()) {
            replacements.search = `%${String(search).trim()}%`;
            conditions.push('(s.full_name LIKE :search OR s.nis LIKE :search)');
        }

        // Include students who are active OR have historical lesson attendance records
        if (academicYearId) {
            replacements.academic_year_id = Number(academicYearId);
            conditions.push(`(
                s.student_status = 'ACTIVE'
                OR EXISTS (
                    SELECT 1
                    FROM lesson_attendance_details lad
                    INNER JOIN lesson_attendance_sessions las ON las.id = lad.session_id
                    WHERE lad.student_id = s.id AND las.academic_year_id = :academic_year_id
                )
            )`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const rows = await db.sequelize.query(
            `SELECT s.id, s.nis, s.full_name, s.student_status
             FROM students s
             ${whereClause}
             ORDER BY s.full_name ASC, s.id ASC
             LIMIT :limit`,
            { replacements, type: db.Sequelize.QueryTypes.SELECT }
        );

        return rows.map((r) => ({
            id: Number(r.id),
            nis: r.nis || null,
            full_name: r.full_name,
            student_status: r.student_status
        }));
    }

    async _resolveAcademicYear(academicYearId = null, attendanceDate = null) {
        if (academicYearId) {
            const year = await AcademicYear.findByPk(Number(academicYearId));
            if (!year) {
                throw new AppError('Tahun ajaran tidak ditemukan.', 404, ERROR_CODES.INVALID_ACADEMIC_YEAR);
            }
            return year;
        }
        return lessonAttendanceService.getActiveAcademicYear({ attendanceDate });
    }

    async getManualRoster({ academicYearId, classId, attendanceDate }) {
        const { attendanceDate: today, currentTime } = lessonAttendanceService.getServerDateTimeInTimezone();
        const targetDate = attendanceDate || today;

        if (targetDate > today) {
            throw new AppError(
                'Tanggal presensi tidak boleh melebihi tanggal hari ini.',
                422,
                ERROR_CODES.INVALID_DATE_RANGE
            );
        }

        const year = await this._resolveAcademicYear(academicYearId, targetDate);
        if (!year.is_active || targetDate < today) {
            throw new AppError(
                'Input presensi manual hanya didukung untuk tanggal hari ini pada tahun ajaran aktif karena riwayat penempatan kelas tidak menyimpan tanggal efektif perpindahan siswa secara historis.',
                422,
                ERROR_CODES.HISTORICAL_ROSTER_UNAVAILABLE
            );
        }

        if ((year.start_date && targetDate < year.start_date) || (year.end_date && targetDate > year.end_date)) {
            throw new AppError(
                'Tanggal presensi berada di luar rentang tahun ajaran yang dipilih.',
                422,
                ERROR_CODES.INVALID_ACADEMIC_YEAR
            );
        }

        const cls = await Class.findByPk(Number(classId), {
            attributes: ['id', 'name', 'grade_id', 'department_id'],
            include: [
                { model: Grade, as: 'grade', attributes: ['id', 'name', 'level'] },
                { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
            ]
        });
        if (!cls) {
            throw new AppError('Kelas tidak ditemukan.', 404, ERROR_CODES.CLASS_NOT_FOUND);
        }

        const [rosterResult, periodInfo, existingSessions] = await Promise.all([
            lessonAttendanceService.getActiveClassRoster({
                classId: cls.id,
                academicYearId: year.id
            }),
            lessonAttendanceService.getAvailableLessonPeriods(currentTime),
            LessonAttendanceSession.findAll({
                where: {
                    academic_year_id: year.id,
                    class_id: cls.id,
                    attendance_date: targetDate
                },
                attributes: ['id', 'lesson_period_id', 'period_number', 'cancelled_at'],
                order: [['period_number', 'ASC']]
            })
        ]);

        const byNumber = new Map(existingSessions.map((s) => [Number(s.period_number), s]));
        const byId = new Map(existingSessions.map((s) => [Number(s.lesson_period_id), s]));

        const periods = periodInfo.periods.map((p) => {
            const plain = p.get ? p.get({ plain: true }) : p;
            const existing = byNumber.get(Number(plain.period_number)) || byId.get(Number(plain.id));
            const isFuture = targetDate === today && plain.start_time > currentTime;
            let state = 'AVAILABLE';
            if (existing) {
                state = existing.cancelled_at ? 'CANCELLED' : 'ALREADY_SUBMITTED';
            } else if (isFuture) {
                state = 'UPCOMING';
            }
            return {
                ...plain,
                attendance_state: state,
                existing_session_id: existing ? String(existing.id) : null,
                is_future: isFuture
            };
        });

        return {
            academic_year: { id: year.id, name: year.name },
            class_info: cls,
            attendance_date: targetDate,
            students: rosterResult.students,
            total_students: rosterResult.total_students,
            periods
        };
    }

    async getMonitoring({
        attendanceDate = null,
        academicYearId = null,
        gradeId = null,
        departmentId = null,
        classId = null,
        status = null,
        search = null
    } = {}) {
        const { attendanceDate: today, currentTime, timezone } = lessonAttendanceService.getServerDateTimeInTimezone();
        const targetDate = attendanceDate || today;

        const year = academicYearId
            ? await AcademicYear.findByPk(Number(academicYearId))
            : await AcademicYear.findOne({ where: { is_active: true }, order: [['id', 'ASC']] });

        if (!year) {
            throw new AppError('Tahun ajaran tidak ditemukan.', 404, ERROR_CODES.ACTIVE_ACADEMIC_YEAR_NOT_FOUND);
        }

        const isTodayActive = targetDate === today && Boolean(year.is_active);

        // 1. Resolve classes to monitor
        const classReplacements = {
            academic_year_id: Number(year.id),
            attendance_date: targetDate
        };
        const classFilters = [];
        if (gradeId) {
            classFilters.push('c.grade_id = :grade_id');
            classReplacements.grade_id = Number(gradeId);
        }
        if (departmentId) {
            classFilters.push('c.department_id = :department_id');
            classReplacements.department_id = Number(departmentId);
        }
        if (classId) {
            classFilters.push('c.id = :class_id');
            classReplacements.class_id = Number(classId);
        }
        if (search && String(search).trim()) {
            classFilters.push('c.name LIKE :search');
            classReplacements.search = `%${String(search).trim()}%`;
        }
        const extraClassWhere = classFilters.length ? `AND ${classFilters.join(' AND ')}` : '';

        let monitoredClasses = [];
        if (isTodayActive) {
            const sql = `
                WITH ranked_class_history AS (
                    SELECT
                        sch.student_id,
                        sch.class_id,
                        ROW_NUMBER() OVER (
                            PARTITION BY sch.student_id, sch.academic_year_id
                            ORDER BY sch.created_at DESC, sch.id DESC
                        ) AS row_num
                    FROM student_class_history sch
                    WHERE sch.academic_year_id = :academic_year_id
                ),
                active_class_counts AS (
                    SELECT
                        rch.class_id,
                        COUNT(*) AS active_student_count
                    FROM ranked_class_history rch
                    INNER JOIN students s ON s.id = rch.student_id
                    WHERE rch.row_num = 1 AND s.student_status = 'ACTIVE'
                    GROUP BY rch.class_id
                )
                SELECT
                    c.id,
                    c.name,
                    g.id AS grade_id,
                    g.name AS grade_name,
                    g.level AS grade_level,
                    d.id AS department_id,
                    d.name AS department_name,
                    d.code AS department_code,
                    COALESCE(acc.active_student_count, 0) AS active_student_count
                FROM classes c
                LEFT JOIN grades g ON g.id = c.grade_id
                LEFT JOIN departments d ON d.id = c.department_id
                LEFT JOIN active_class_counts acc ON acc.class_id = c.id
                WHERE (
                    COALESCE(acc.active_student_count, 0) > 0
                    OR EXISTS (
                        SELECT 1 FROM lesson_attendance_sessions las
                        WHERE las.academic_year_id = :academic_year_id
                          AND las.class_id = c.id
                          AND las.attendance_date = :attendance_date
                    )
                )
                ${extraClassWhere}
                ORDER BY g.level ASC, c.name ASC, c.id ASC
            `;
            monitoredClasses = await db.sequelize.query(sql, {
                replacements: classReplacements,
                type: db.Sequelize.QueryTypes.SELECT
            });
        } else {
            const sql = `
                SELECT DISTINCT
                    c.id,
                    c.name,
                    g.id AS grade_id,
                    g.name AS grade_name,
                    g.level AS grade_level,
                    d.id AS department_id,
                    d.name AS department_name,
                    d.code AS department_code,
                    0 AS active_student_count
                FROM lesson_attendance_sessions las
                INNER JOIN classes c ON c.id = las.class_id
                LEFT JOIN grades g ON g.id = c.grade_id
                LEFT JOIN departments d ON d.id = c.department_id
                WHERE las.academic_year_id = :academic_year_id
                  AND las.attendance_date = :attendance_date
                ${extraClassWhere}
                ORDER BY g.level ASC, c.name ASC, c.id ASC
            `;
            monitoredClasses = await db.sequelize.query(sql, {
                replacements: classReplacements,
                type: db.Sequelize.QueryTypes.SELECT
            });
        }

        // 2. Fetch sessions + aggregated student status counts in ONE query (no N+1)
        const sessionRows = await db.sequelize.query(
            `SELECT
                s.id,
                s.class_id,
                s.teacher_id,
                t.full_name AS teacher_name,
                s.subject_id,
                sub.name AS subject_name,
                sub.code AS subject_code,
                s.lesson_period_id,
                s.period_number,
                s.period_start_time,
                s.period_end_time,
                s.input_method,
                s.notes,
                s.cancelled_at,
                s.created_at,
                COUNT(d.id) AS total_students,
                COALESCE(SUM(CASE WHEN d.status = 'HADIR' THEN 1 ELSE 0 END), 0) AS hadir,
                COALESCE(SUM(CASE WHEN d.status = 'TERLAMBAT' THEN 1 ELSE 0 END), 0) AS terlambat,
                COALESCE(SUM(CASE WHEN d.status = 'IZIN' THEN 1 ELSE 0 END), 0) AS izin,
                COALESCE(SUM(CASE WHEN d.status = 'SAKIT' THEN 1 ELSE 0 END), 0) AS sakit,
                COALESCE(SUM(CASE WHEN d.status = 'ALPA' THEN 1 ELSE 0 END), 0) AS alpa
            FROM lesson_attendance_sessions s
            INNER JOIN teachers t ON t.id = s.teacher_id
            INNER JOIN subjects sub ON sub.id = s.subject_id
            LEFT JOIN lesson_attendance_details d ON d.session_id = s.id
            WHERE s.academic_year_id = :academic_year_id
              AND s.attendance_date = :attendance_date
            GROUP BY
                s.id, s.class_id, s.teacher_id, t.full_name,
                s.subject_id, sub.name, sub.code,
                s.lesson_period_id, s.period_number, s.period_start_time, s.period_end_time,
                s.input_method, s.notes, s.cancelled_at, s.created_at
            ORDER BY s.period_number ASC`,
            {
                replacements: {
                    academic_year_id: Number(year.id),
                    attendance_date: targetDate
                },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        // Fetch cancellation audit info for cancelled sessions in one query
        const cancelledSessionIds = sessionRows.filter((s) => s.cancelled_at).map((s) => s.id);
        const cancelLogMap = new Map();
        if (cancelledSessionIds.length > 0) {
            const cancelLogs = await db.sequelize.query(
                `SELECT l.session_id, l.description, l.created_at, u.name AS actor_name
                 FROM lesson_attendance_logs l
                 LEFT JOIN users u ON u.id = l.user_id
                 WHERE l.session_id IN (:sessionIds) AND l.action = :action
                 ORDER BY l.created_at DESC, l.id DESC`,
                {
                    replacements: {
                        sessionIds: cancelledSessionIds,
                        action: AUDIT_ACTIONS.ATTENDANCE_CANCELLED
                    },
                    type: db.Sequelize.QueryTypes.SELECT
                }
            );
            for (const log of cancelLogs) {
                const key = String(log.session_id);
                if (!cancelLogMap.has(key)) {
                    cancelLogMap.set(key, log);
                }
            }
        }

        // 3. Determine period columns
        let templatePeriods = [];
        try {
            const periodInfo = await lessonAttendanceService.getAvailableLessonPeriods(currentTime);
            templatePeriods = periodInfo.periods.map((p) => (p.get ? p.get({ plain: true }) : p));
        } catch (err) {
            if (err.errorCode !== ERROR_CODES.LESSON_PERIOD_TEMPLATE_NOT_FOUND) throw err;
        }

        const periodMap = new Map();
        if (isTodayActive) {
            for (const p of templatePeriods) {
                periodMap.set(Number(p.period_number), {
                    period_number: Number(p.period_number),
                    lesson_period_id: p.id,
                    name: p.name,
                    start_time: p.start_time,
                    end_time: p.end_time,
                    from_template: true
                });
            }
        }
        // Always include any period numbers present in actual sessions (especially for historical dates)
        for (const s of sessionRows) {
            const pn = Number(s.period_number);
            if (!periodMap.has(pn)) {
                periodMap.set(pn, {
                    period_number: pn,
                    lesson_period_id: s.lesson_period_id,
                    name: `Jam ke-${pn}`,
                    start_time: s.period_start_time,
                    end_time: s.period_end_time,
                    from_template: false
                });
            }
        }
        const periods = Array.from(periodMap.values()).sort((a, b) => a.period_number - b.period_number);

        // 4. Build matrix
        const sessionByClassPeriod = new Map();
        for (const s of sessionRows) {
            sessionByClassPeriod.set(`${s.class_id}:${s.period_number}`, s);
        }

        const summary = {
            total_classes: 0,
            submitted_count: 0,
            not_recorded_count: 0,
            upcoming_count: 0,
            cancelled_count: 0,
            unknown_count: 0
        };

        const rows = [];
        for (const cls of monitoredClasses) {
            const cells = {};
            let rowHasStatusMatch = !status;

            for (const p of periods) {
                const sess = sessionByClassPeriod.get(`${cls.id}:${p.period_number}`);
                let cell;
                if (sess) {
                    const isCancelled = Boolean(sess.cancelled_at);
                    const cancelLog = isCancelled ? cancelLogMap.get(String(sess.id)) : null;
                    cell = {
                        status: isCancelled ? 'CANCELLED' : 'SUBMITTED',
                        session_id: String(sess.id),
                        period_number: p.period_number,
                        lesson_period_id: sess.lesson_period_id,
                        period_start_time: sess.period_start_time,
                        period_end_time: sess.period_end_time,
                        teacher_id: sess.teacher_id,
                        teacher_name: sess.teacher_name,
                        subject_id: sess.subject_id,
                        subject_name: sess.subject_name,
                        input_method: sess.input_method,
                        notes: sess.notes,
                        created_at: sess.created_at,
                        cancelled_at: sess.cancelled_at,
                        cancellation_reason: cancelLog?.description || null,
                        cancelled_by_name: cancelLog?.actor_name || null,
                        total_students: Number(sess.total_students),
                        hadir: Number(sess.hadir),
                        terlambat: Number(sess.terlambat),
                        izin: Number(sess.izin),
                        sakit: Number(sess.sakit),
                        alpa: Number(sess.alpa)
                    };
                } else if (!isTodayActive) {
                    cell = {
                        status: 'UNKNOWN',
                        session_id: null,
                        period_number: p.period_number,
                        lesson_period_id: p.lesson_period_id,
                        period_start_time: p.start_time,
                        period_end_time: p.end_time
                    };
                } else if (p.start_time && p.start_time > currentTime) {
                    cell = {
                        status: 'UPCOMING',
                        session_id: null,
                        period_number: p.period_number,
                        lesson_period_id: p.lesson_period_id,
                        period_start_time: p.start_time,
                        period_end_time: p.end_time
                    };
                } else {
                    cell = {
                        status: 'NOT_RECORDED',
                        session_id: null,
                        period_number: p.period_number,
                        lesson_period_id: p.lesson_period_id,
                        period_start_time: p.start_time,
                        period_end_time: p.end_time
                    };
                }

                if (status && cell.status === status) {
                    rowHasStatusMatch = true;
                }
                cells[p.period_number] = cell;
            }

            if (!rowHasStatusMatch) continue;

            for (const p of periods) {
                const st = cells[p.period_number].status;
                if (st === 'SUBMITTED') summary.submitted_count += 1;
                else if (st === 'NOT_RECORDED') summary.not_recorded_count += 1;
                else if (st === 'UPCOMING') summary.upcoming_count += 1;
                else if (st === 'CANCELLED') summary.cancelled_count += 1;
                else if (st === 'UNKNOWN') summary.unknown_count += 1;
            }

            rows.push({
                class_id: Number(cls.id),
                class_name: cls.name,
                grade_id: cls.grade_id,
                grade_name: cls.grade_name,
                department_id: cls.department_id,
                department_name: cls.department_name,
                department_code: cls.department_code,
                active_student_count: Number(cls.active_student_count),
                cells
            });
        }

        summary.total_classes = rows.length;

        return {
            attendance_date: targetDate,
            is_today: targetDate === today,
            is_historical_mode: !isTodayActive,
            current_time: currentTime,
            timezone,
            academic_year: {
                id: year.id,
                name: year.name,
                is_active: Boolean(year.is_active)
            },
            periods,
            rows,
            summary,
            note: isTodayActive
                ? 'Status "Belum Diabsen" dihitung berdasarkan template jam pelajaran aktif, bukan jadwal mengajar per kelas.'
                : 'Mode historis menampilkan transaksi yang tercatat pada tanggal tersebut karena jadwal historis dan riwayat perpindahan siswa harian tidak direkonstruksi penuh.'
        };
    }

    async listSessions(query = {}) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
        const offset = (page - 1) * limit;

        const sortKey = SESSION_SORT_WHITELIST[query.sort_by] || 's.attendance_date';
        const sortOrder = String(query.sort_order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const where = [];
        const replacements = { limit, offset };

        if (query.academic_year_id) {
            where.push('s.academic_year_id = :academic_year_id');
            replacements.academic_year_id = Number(query.academic_year_id);
        }
        if (query.date_from) {
            where.push('s.attendance_date >= :date_from');
            replacements.date_from = query.date_from;
        }
        if (query.date_to) {
            where.push('s.attendance_date <= :date_to');
            replacements.date_to = query.date_to;
        }
        if (query.grade_id) {
            where.push('c.grade_id = :grade_id');
            replacements.grade_id = Number(query.grade_id);
        }
        if (query.department_id) {
            where.push('c.department_id = :department_id');
            replacements.department_id = Number(query.department_id);
        }
        if (query.class_id) {
            where.push('s.class_id = :class_id');
            replacements.class_id = Number(query.class_id);
        }
        if (query.teacher_id) {
            where.push('s.teacher_id = :teacher_id');
            replacements.teacher_id = Number(query.teacher_id);
        }
        if (query.subject_id) {
            where.push('s.subject_id = :subject_id');
            replacements.subject_id = Number(query.subject_id);
        }
        if (query.period_number) {
            where.push('s.period_number = :period_number');
            replacements.period_number = Number(query.period_number);
        }
        if (query.input_method && ['QR', 'ADMIN'].includes(String(query.input_method).toUpperCase())) {
            where.push('s.input_method = :input_method');
            replacements.input_method = String(query.input_method).toUpperCase();
        }
        const statusFilter = String(query.status || 'active').toLowerCase();
        if (statusFilter === 'active') {
            where.push('s.cancelled_at IS NULL');
        } else if (statusFilter === 'cancelled') {
            where.push('s.cancelled_at IS NOT NULL');
        }
        if (query.search && String(query.search).trim()) {
            where.push('(c.name LIKE :search OR t.full_name LIKE :search OR sub.name LIKE :search OR s.notes LIKE :search)');
            replacements.search = `%${String(query.search).trim()}%`;
        }

        const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
        const baseJoins = `
            FROM lesson_attendance_sessions s
            INNER JOIN classes c ON c.id = s.class_id
            LEFT JOIN grades g ON g.id = c.grade_id
            LEFT JOIN departments dpt ON dpt.id = c.department_id
            INNER JOIN teachers t ON t.id = s.teacher_id
            INNER JOIN subjects sub ON sub.id = s.subject_id
            INNER JOIN academic_years ay ON ay.id = s.academic_year_id
        `;

        const [countRows] = await db.sequelize.query(
            `SELECT COUNT(*) AS total ${baseJoins} ${whereSql}`,
            { replacements }
        );
        const total = Number(countRows[0]?.total || 0);

        const dataSql = `
            SELECT
                s.id,
                s.academic_year_id,
                ay.name AS academic_year_name,
                s.class_id,
                c.name AS class_name,
                g.name AS grade_name,
                dpt.name AS department_name,
                s.teacher_id,
                t.full_name AS teacher_name,
                s.subject_id,
                sub.name AS subject_name,
                sub.code AS subject_code,
                s.lesson_period_id,
                s.attendance_date,
                s.period_number,
                s.period_start_time,
                s.period_end_time,
                s.notes,
                s.input_method,
                s.cancelled_at,
                s.created_at,
                s.updated_at,
                COUNT(det.id) AS total_students,
                COALESCE(SUM(CASE WHEN det.status = 'HADIR' THEN 1 ELSE 0 END), 0) AS hadir,
                COALESCE(SUM(CASE WHEN det.status = 'TERLAMBAT' THEN 1 ELSE 0 END), 0) AS terlambat,
                COALESCE(SUM(CASE WHEN det.status = 'IZIN' THEN 1 ELSE 0 END), 0) AS izin,
                COALESCE(SUM(CASE WHEN det.status = 'SAKIT' THEN 1 ELSE 0 END), 0) AS sakit,
                COALESCE(SUM(CASE WHEN det.status = 'ALPA' THEN 1 ELSE 0 END), 0) AS alpa
            ${baseJoins}
            LEFT JOIN lesson_attendance_details det ON det.session_id = s.id
            ${whereSql}
            GROUP BY
                s.id, s.academic_year_id, ay.name, s.class_id, c.name, g.name, dpt.name,
                s.teacher_id, t.full_name, s.subject_id, sub.name, sub.code,
                s.lesson_period_id, s.attendance_date, s.period_number,
                s.period_start_time, s.period_end_time, s.notes, s.input_method,
                s.cancelled_at, s.created_at, s.updated_at
            ORDER BY ${sortKey} ${sortOrder}, s.created_at DESC, s.id DESC
            LIMIT :limit OFFSET :offset
        `;

        const rows = await db.sequelize.query(dataSql, {
            replacements,
            type: db.Sequelize.QueryTypes.SELECT
        });

        return {
            rows: rows.map((r) => ({
                ...r,
                id: String(r.id),
                total_students: Number(r.total_students),
                hadir: Number(r.hadir),
                terlambat: Number(r.terlambat),
                izin: Number(r.izin),
                sakit: Number(r.sakit),
                alpa: Number(r.alpa),
                is_cancelled: Boolean(r.cancelled_at)
            })),
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit) || 1
            }
        };
    }

    async getSessionDetail(sessionId, { search = null, status = null, transaction = null } = {}) {
        const session = await LessonAttendanceSession.findByPk(sessionId, {
            include: [
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] },
                {
                    model: Class,
                    as: 'class_info',
                    attributes: ['id', 'name', 'grade_id', 'department_id'],
                    include: [
                        { model: Grade, as: 'grade', attributes: ['id', 'name'] },
                        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
                    ]
                },
                { model: Teacher, as: 'teacher', attributes: ['id', 'full_name', 'nip'] },
                { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
                { model: LessonPeriod, as: 'lesson_period', attributes: ['id', 'name', 'period_number'] }
            ],
            transaction
        });

        if (!session) {
            throw new AppError('Transaksi presensi tidak ditemukan.', 404, ERROR_CODES.ATTENDANCE_SESSION_NOT_FOUND);
        }

        // Historical roster: read directly from lesson_attendance_details -> students without ACTIVE filter
        const allDetails = await LessonAttendanceDetail.findAll({
            where: { session_id: session.id },
            include: [{
                model: Student,
                as: 'student',
                attributes: ['id', 'nis', 'full_name', 'student_status']
            }],
            order: [
                [{ model: Student, as: 'student' }, 'full_name', 'ASC'],
                ['id', 'ASC']
            ],
            transaction
        });

        const summary = {
            total_students: allDetails.length,
            HADIR: 0,
            TERLAMBAT: 0,
            IZIN: 0,
            SAKIT: 0,
            ALPA: 0
        };
        for (const d of allDetails) {
            if (Object.prototype.hasOwnProperty.call(summary, d.status)) {
                summary[d.status] += 1;
            }
        }

        const searchLower = search ? String(search).trim().toLowerCase() : '';
        const filteredDetails = allDetails
            .filter((d) => {
                if (status && d.status !== status) return false;
                if (searchLower) {
                    const name = (d.student?.full_name || '').toLowerCase();
                    const nis = (d.student?.nis || '').toLowerCase();
                    return name.includes(searchLower) || nis.includes(searchLower);
                }
                return true;
            })
            .map((d) => ({
                id: String(d.id),
                student_id: d.student_id,
                nis: d.student?.nis || null,
                full_name: d.student?.full_name || '-',
                student_status: d.student?.student_status || null,
                status: d.status,
                notes: d.notes || ''
            }));

        return {
            session: {
                id: String(session.id),
                academic_year_id: session.academic_year_id,
                academic_year_name: session.academic_year?.name || '-',
                class_id: session.class_id,
                class_name: session.class_info?.name || '-',
                grade_name: session.class_info?.grade?.name || null,
                department_name: session.class_info?.department?.name || null,
                teacher_id: session.teacher_id,
                teacher_name: session.teacher?.full_name || '-',
                teacher_nip: session.teacher?.nip || null,
                subject_id: session.subject_id,
                subject_name: session.subject?.name || '-',
                subject_code: session.subject?.code || null,
                lesson_period_id: session.lesson_period_id,
                attendance_date: session.attendance_date,
                period_number: session.period_number,
                period_start_time: session.period_start_time,
                period_end_time: session.period_end_time,
                notes: session.notes || '',
                input_method: session.input_method,
                cancelled_at: session.cancelled_at,
                is_cancelled: Boolean(session.cancelled_at),
                created_at: session.createdAt || session.created_at,
                updated_at: session.updatedAt || session.updated_at
            },
            summary,
            students: filteredDetails
        };
    }

    async createManualAttendance({
        academicYearId,
        classId,
        teacherId,
        subjectId,
        attendanceDate,
        lessonPeriodIds,
        students,
        notes = null,
        actorUserId,
        ipAddress = null
    }) {
        const { attendanceDate: today, currentTime } = lessonAttendanceService.getServerDateTimeInTimezone();
        if (attendanceDate > today) {
            throw new AppError('Tanggal presensi tidak boleh di masa depan.', 422, ERROR_CODES.INVALID_DATE_RANGE);
        }

        const year = await this._resolveAcademicYear(academicYearId, attendanceDate);
        if ((year.start_date && attendanceDate < year.start_date) || (year.end_date && attendanceDate > year.end_date)) {
            throw new AppError('Tanggal presensi berada di luar rentang tahun ajaran.', 422, ERROR_CODES.INVALID_ACADEMIC_YEAR);
        }

        if (!year.is_active || attendanceDate < today) {
            throw new AppError(
                'Input presensi manual untuk tanggal lampau atau tahun ajaran non-aktif tidak dapat dilakukan karena riwayat kelas tidak menyimpan tanggal efektif perpindahan siswa.',
                422,
                ERROR_CODES.HISTORICAL_ROSTER_UNAVAILABLE
            );
        }

        const seenStudents = new Set();
        const normalizedStudents = [];
        for (const item of students) {
            const sid = Number(item.student_id);
            if (!Number.isInteger(sid) || sid <= 0) {
                throw new AppError('Terdapat ID siswa tidak valid.', 422, ERROR_CODES.INVALID_STUDENT_ROSTER);
            }
            if (seenStudents.has(sid)) {
                throw new AppError(`Siswa dengan ID ${sid} tercatat ganda.`, 422, ERROR_CODES.INVALID_STUDENT_ROSTER);
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
            return await db.sequelize.transaction(async (transaction) => {
                const [cls, teacher, subject] = await Promise.all([
                    Class.findByPk(Number(classId), { attributes: ['id', 'name'], transaction }),
                    Teacher.findByPk(Number(teacherId), {
                        attributes: ['id', 'full_name', 'user_id'],
                        include: [{ model: User, as: 'user', attributes: ['id', 'is_active'], required: false }],
                        transaction
                    }),
                    Subject.findOne({ where: { id: Number(subjectId), is_active: true }, attributes: ['id', 'name'], transaction })
                ]);

                if (!cls) throw new AppError('Kelas tidak ditemukan.', 404, ERROR_CODES.CLASS_NOT_FOUND);
                if (!teacher || (teacher.user && teacher.user.is_active === false)) {
                    throw new AppError('Guru pengajar tidak ditemukan atau tidak aktif.', 422, ERROR_CODES.TEACHER_NOT_FOUND);
                }
                if (!subject) throw new AppError('Mata pelajaran tidak ditemukan atau tidak aktif.', 422, ERROR_CODES.SUBJECT_NOT_FOUND);

                const periods = await lessonAttendanceService.validateLessonPeriodsForSubmission(lessonPeriodIds, {
                    allowFuture: false,
                    currentTimeStr: currentTime,
                    transaction
                });

                const rosterResult = await lessonAttendanceService.getActiveClassRoster({
                    classId: cls.id,
                    academicYearId: year.id,
                    transaction
                });
                if (rosterResult.total_students === 0) {
                    throw new AppError('Tidak ada siswa aktif yang terdaftar pada kelas ini.', 422, ERROR_CODES.EMPTY_STUDENT_ROSTER);
                }

                const dbStudentIds = new Set(rosterResult.students.map((s) => s.student_id));
                const rosterMismatch =
                    dbStudentIds.size !== seenStudents.size ||
                    rosterResult.students.some((s) => !seenStudents.has(s.student_id)) ||
                    normalizedStudents.some((s) => !dbStudentIds.has(s.student_id));

                if (rosterMismatch) {
                    throw new AppError(
                        'Daftar siswa tidak sesuai dengan rombel aktif kelas saat ini. Silakan muat ulang daftar siswa.',
                        409,
                        ERROR_CODES.ATTENDANCE_ROSTER_CHANGED
                    );
                }

                const existingSessions = await LessonAttendanceSession.findAll({
                    where: {
                        academic_year_id: year.id,
                        class_id: cls.id,
                        attendance_date: attendanceDate,
                        [Op.or]: [
                            { period_number: { [Op.in]: periods.map((p) => p.period_number) } },
                            { lesson_period_id: { [Op.in]: periods.map((p) => p.id) } }
                        ]
                    },
                    attributes: ['id', 'period_number', 'cancelled_at'],
                    transaction
                });

                if (existingSessions.length > 0) {
                    const cancelled = existingSessions.filter((s) => s.cancelled_at);
                    const nums = [...new Set(existingSessions.map((s) => s.period_number))].sort((a, b) => a - b);
                    if (cancelled.length > 0) {
                        throw new AppError(
                            `Jam ke-${nums.join(', ')} sudah memiliki transaksi yang dibatalkan. Silakan pulihkan transaksi tersebut melalui Data Presensi dan lakukan koreksi.`,
                            409,
                            ERROR_CODES.ATTENDANCE_ALREADY_EXISTS
                        );
                    }
                    throw new AppError(
                        `Presensi untuk jam ke-${nums.join(', ')} pada tanggal ini sudah tercatat.`,
                        409,
                        ERROR_CODES.ATTENDANCE_ALREADY_EXISTS
                    );
                }

                const summary = lessonAttendanceService._buildAttendanceSummary(normalizedStudents);
                const createdSessions = [];

                for (const period of periods) {
                    const session = await LessonAttendanceSession.create({
                        academic_year_id: year.id,
                        class_id: cls.id,
                        teacher_id: teacher.id,
                        subject_id: subject.id,
                        lesson_period_id: period.id,
                        attendance_date: attendanceDate,
                        period_number: period.period_number,
                        period_start_time: period.start_time,
                        period_end_time: period.end_time,
                        notes: notes ? String(notes).trim().slice(0, 1000) : null,
                        input_method: INPUT_METHODS.ADMIN,
                        cancelled_at: null
                    }, { transaction });

                    await LessonAttendanceDetail.bulkCreate(
                        normalizedStudents.map((d) => ({
                            session_id: session.id,
                            student_id: d.student_id,
                            status: d.status,
                            notes: d.notes
                        })),
                        { transaction }
                    );

                    await auditService.record({
                        sessionId: session.id,
                        teacherId: teacher.id,
                        userId: actorUserId,
                        action: AUDIT_ACTIONS.ATTENDANCE_MANUAL_CREATED,
                        oldData: null,
                        newData: {
                            academic_year_id: year.id,
                            class_id: cls.id,
                            teacher_id: teacher.id,
                            subject_id: subject.id,
                            lesson_period_id: period.id,
                            period_number: period.period_number,
                            attendance_date: attendanceDate,
                            input_method: INPUT_METHODS.ADMIN,
                            total_students: normalizedStudents.length,
                            summary
                        },
                        description: `Presensi manual jam ke-${period.period_number} dibuat oleh administrator.`,
                        ipAddress,
                        transaction
                    });

                    createdSessions.push({
                        session_id: String(session.id),
                        period_number: session.period_number
                    });
                }

                return {
                    class_name: cls.name,
                    teacher_name: teacher.full_name,
                    subject_name: subject.name,
                    attendance_date: attendanceDate,
                    total_sessions: createdSessions.length,
                    total_students: normalizedStudents.length,
                    periods: createdSessions,
                    summary
                };
            });
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new AppError(
                    'Presensi untuk kelas dan jam pelajaran ini pada tanggal tersebut sudah tercatat.',
                    409,
                    ERROR_CODES.ATTENDANCE_ALREADY_EXISTS
                );
            }
            throw error;
        }
    }

    async correctSession({
        sessionId,
        teacherId = undefined,
        subjectId = undefined,
        notes = undefined,
        students = undefined,
        reason,
        expectedUpdatedAt = null,
        actorUserId,
        ipAddress = null
    }) {
        const cleanReason = reason ? String(reason).trim() : '';
        if (!cleanReason) {
            throw new AppError('Alasan koreksi wajib diisi.', 422, ERROR_CODES.ATTENDANCE_CORRECTION_REASON_REQUIRED);
        }

        return db.sequelize.transaction(async (transaction) => {
            const session = await LessonAttendanceSession.findByPk(sessionId, {
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!session) {
                throw new AppError('Transaksi presensi tidak ditemukan.', 404, ERROR_CODES.ATTENDANCE_SESSION_NOT_FOUND);
            }
            if (session.cancelled_at) {
                throw new AppError(
                    'Transaksi yang sudah dibatalkan tidak dapat dikoreksi. Pulihkan transaksi terlebih dahulu.',
                    409,
                    ERROR_CODES.ATTENDANCE_SESSION_CANCELLED
                );
            }
            if (expectedUpdatedAt) {
                const currentVal = session.updatedAt || session.updated_at;
                const currentIso = currentVal ? new Date(currentVal).toISOString() : '';
                const expectedIso = new Date(expectedUpdatedAt).toISOString();
                if (currentIso !== expectedIso) {
                    throw new AppError(
                        'Data transaksi telah diubah oleh pengguna lain. Silakan muat ulang detail transaksi.',
                        409,
                        ERROR_CODES.ATTENDANCE_CONCURRENT_UPDATE
                    );
                }
            }

            const oldData = {};
            const newData = {};
            const sessionUpdates = {};

            if (teacherId !== undefined && Number(teacherId) !== Number(session.teacher_id)) {
                const teacher = await Teacher.findByPk(Number(teacherId), {
                    attributes: ['id', 'full_name'],
                    include: [{ model: User, as: 'user', attributes: ['id', 'is_active'], required: false }],
                    transaction
                });
                if (!teacher || (teacher.user && teacher.user.is_active === false)) {
                    throw new AppError('Guru pengajar tidak ditemukan atau tidak aktif.', 422, ERROR_CODES.TEACHER_NOT_FOUND);
                }
                oldData.teacher_id = session.teacher_id;
                newData.teacher_id = teacher.id;
                sessionUpdates.teacher_id = teacher.id;
            }

            if (subjectId !== undefined && Number(subjectId) !== Number(session.subject_id)) {
                const subject = await Subject.findOne({
                    where: { id: Number(subjectId), is_active: true },
                    attributes: ['id', 'name'],
                    transaction
                });
                if (!subject) {
                    throw new AppError('Mata pelajaran tidak ditemukan atau tidak aktif.', 422, ERROR_CODES.SUBJECT_NOT_FOUND);
                }
                oldData.subject_id = session.subject_id;
                newData.subject_id = subject.id;
                sessionUpdates.subject_id = subject.id;
            }

            if (notes !== undefined) {
                const cleanNotes = notes ? String(notes).trim().slice(0, 1000) : null;
                const existingNotes = session.notes || null;
                if (cleanNotes !== existingNotes) {
                    oldData.notes = existingNotes;
                    newData.notes = cleanNotes;
                    sessionUpdates.notes = cleanNotes;
                }
            }

            const changedStudentsOld = [];
            const changedStudentsNew = [];

            if (Array.isArray(students) && students.length > 0) {
                const existingDetails = await LessonAttendanceDetail.findAll({
                    where: { session_id: session.id },
                    include: [{ model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] }],
                    lock: transaction.LOCK.UPDATE,
                    transaction
                });

                const detailMap = new Map(existingDetails.map((d) => [Number(d.student_id), d]));
                const seenIds = new Set();

                for (const item of students) {
                    const sid = Number(item.student_id);
                    if (seenIds.has(sid)) {
                        throw new AppError(`Siswa dengan ID ${sid} duplikat dalam koreksi.`, 422, ERROR_CODES.INVALID_STUDENT_ROSTER);
                    }
                    seenIds.add(sid);

                    const existing = detailMap.get(sid);
                    if (!existing) {
                        throw new AppError(
                            `Siswa dengan ID ${sid} tidak terdaftar dalam roster transaksi historis ini. Koreksi biasa tidak dapat menambah siswa baru.`,
                            422,
                            ERROR_CODES.INVALID_STUDENT_ROSTER
                        );
                    }
                    if (!ATTENDANCE_STATUSES.includes(item.status)) {
                        throw new AppError(`Status presensi "${item.status}" tidak valid.`, 400, ERROR_CODES.VALIDATION_ERROR);
                    }

                    const newNotes = item.notes !== undefined
                        ? (item.notes ? String(item.notes).trim().slice(0, 500) : null)
                        : (existing.notes || null);
                    const oldNotes = existing.notes || null;

                    if (existing.status !== item.status || oldNotes !== newNotes) {
                        changedStudentsOld.push({
                            student_id: sid,
                            student_name: existing.student?.full_name || null,
                            status: existing.status,
                            notes: oldNotes
                        });
                        changedStudentsNew.push({
                            student_id: sid,
                            student_name: existing.student?.full_name || null,
                            status: item.status,
                            notes: newNotes
                        });
                        await existing.update({ status: item.status, notes: newNotes }, { transaction });
                    }
                }
            }

            if (changedStudentsNew.length > 0) {
                oldData.students = changedStudentsOld;
                newData.students = changedStudentsNew;
            }

            if (Object.keys(sessionUpdates).length === 0 && changedStudentsNew.length === 0) {
                throw new AppError('Tidak ada perubahan data yang disimpan.', 422, ERROR_CODES.VALIDATION_ERROR);
            }

            // Always bump updated_at by at least 1s (MySQL DATETIME has 1s resolution) for optimistic concurrency
            const currentUpdatedVal = session.updatedAt || session.updated_at;
            const prevUpdatedMs = currentUpdatedVal ? new Date(currentUpdatedVal).getTime() : 0;
            sessionUpdates.updatedAt = new Date(Math.max(Date.now(), prevUpdatedMs + 1000));
            await LessonAttendanceSession.update(sessionUpdates, {
                where: { id: session.id },
                silent: true,
                transaction
            });

            await auditService.record({
                sessionId: session.id,
                teacherId: sessionUpdates.teacher_id || session.teacher_id,
                userId: actorUserId,
                action: AUDIT_ACTIONS.ATTENDANCE_CORRECTED,
                oldData,
                newData,
                description: cleanReason,
                ipAddress,
                transaction
            });

            return this.getSessionDetail(session.id, { transaction });
        });
    }

    async cancelSession({ sessionId, reason, actorUserId, ipAddress = null }) {
        const cleanReason = reason ? String(reason).trim() : '';
        if (!cleanReason) {
            throw new AppError('Alasan pembatalan wajib diisi.', 422, ERROR_CODES.ATTENDANCE_CANCELLATION_REASON_REQUIRED);
        }

        return db.sequelize.transaction(async (transaction) => {
            const session = await LessonAttendanceSession.findByPk(sessionId, {
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!session) {
                throw new AppError('Transaksi presensi tidak ditemukan.', 404, ERROR_CODES.ATTENDANCE_SESSION_NOT_FOUND);
            }
            if (session.cancelled_at) {
                throw new AppError('Transaksi presensi sudah dibatalkan sebelumnya.', 409, ERROR_CODES.ATTENDANCE_ALREADY_CANCELLED);
            }

            const cancelledAt = new Date();
            await session.update({ cancelled_at: cancelledAt }, { transaction });

            await auditService.record({
                sessionId: session.id,
                teacherId: session.teacher_id,
                userId: actorUserId,
                action: AUDIT_ACTIONS.ATTENDANCE_CANCELLED,
                oldData: { cancelled_at: null },
                newData: { cancelled_at: cancelledAt.toISOString() },
                description: cleanReason,
                ipAddress,
                transaction
            });

            return {
                id: String(session.id),
                cancelled_at: cancelledAt
            };
        });
    }

    async restoreSession({ sessionId, reason, actorUserId, ipAddress = null }) {
        const cleanReason = reason ? String(reason).trim() : '';
        if (!cleanReason) {
            throw new AppError('Alasan pemulihan wajib diisi.', 422, ERROR_CODES.ATTENDANCE_RESTORE_REASON_REQUIRED);
        }

        return db.sequelize.transaction(async (transaction) => {
            const session = await LessonAttendanceSession.findByPk(sessionId, {
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!session) {
                throw new AppError('Transaksi presensi tidak ditemukan.', 404, ERROR_CODES.ATTENDANCE_SESSION_NOT_FOUND);
            }
            if (!session.cancelled_at) {
                throw new AppError('Transaksi presensi ini tidak dalam status dibatalkan.', 409, ERROR_CODES.ATTENDANCE_NOT_CANCELLED);
            }

            const prevCancelledAt = session.cancelled_at;
            await session.update({ cancelled_at: null }, { transaction });

            await auditService.record({
                sessionId: session.id,
                teacherId: session.teacher_id,
                userId: actorUserId,
                action: AUDIT_ACTIONS.ATTENDANCE_RESTORED,
                oldData: { cancelled_at: prevCancelledAt },
                newData: { cancelled_at: null },
                description: cleanReason,
                ipAddress,
                transaction
            });

            return {
                id: String(session.id),
                cancelled_at: null
            };
        });
    }

    async getSessionLogs(sessionId) {
        const session = await LessonAttendanceSession.findByPk(sessionId, { attributes: ['id'] });
        if (!session) {
            throw new AppError('Transaksi presensi tidak ditemukan.', 404, ERROR_CODES.ATTENDANCE_SESSION_NOT_FOUND);
        }

        const logs = await LessonAttendanceLog.findAll({
            where: { session_id: session.id },
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'username'], required: false },
                { model: Teacher, as: 'teacher', attributes: ['id', 'full_name'], required: false }
            ],
            order: [['created_at', 'ASC'], ['id', 'ASC']]
        });

        return logs.map((l) => ({
            id: String(l.id),
            session_id: String(l.session_id),
            action: l.action,
            actor_user: l.user ? { id: l.user.id, name: l.user.name, username: l.user.username } : null,
            teacher: l.teacher ? { id: l.teacher.id, full_name: l.teacher.full_name } : null,
            old_data: l.old_data,
            new_data: l.new_data,
            description: l.description,
            ip_address: l.ip_address,
            created_at: l.created_at
        }));
    }
}

module.exports = new LessonAttendanceAdminService();
