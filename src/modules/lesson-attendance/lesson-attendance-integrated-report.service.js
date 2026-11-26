'use strict';

const db = require('../../models');
const { AcademicYear, User, Role, Teacher } = db;
const lessonAttendanceService = require('./lesson-attendance.service');
const analysisService = require('./lesson-attendance-integrated-analysis.service');
const { FINDING_CODES, FINDING_CATEGORIES, CATEGORY } = analysisService;
const { ERROR_CODES, AppError, DEFAULT_TIMEZONE } = require('./lesson-attendance.constants');
const logger = require('../../core/logger');

const QueryTypes = db.Sequelize.QueryTypes;
const PRIVILEGED_ROLES = new Set(['SUPERADMIN', 'ADMIN', 'KESISWAAN', 'STAFF_KESISWAAN', 'TATIB']);
const MAX_SEARCH_LENGTH = 100;

const DISCLAIMER =
    'Daftar ini merupakan hasil pemeriksaan silang data presensi. Potensi pelanggaran dan ketidaksesuaian memerlukan verifikasi oleh wali kelas, kesiswaan, atau petugas tatib sebelum ditetapkan sebagai pelanggaran.';

const toMin = (t) => {
    if (!t) return null;
    const m = String(t).match(/^(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

const hm = (t) => (t ? String(t).slice(0, 5) : null);

function formatClock(date, timezone) {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false
    }).format(d).replace('24:', '00:');
}

function formatDateTimeIso(date) {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function dateKey(v) {
    if (!v) return null;
    if (typeof v === 'string') return v.slice(0, 10);
    return new Date(v).toISOString().slice(0, 10);
}

function normalizeGateStatus(status) {
    const s = String(status || '').toUpperCase();
    if (!s || s === 'INCOMPLETE') return null;
    if (['PRESENT', 'HADIR', 'ONTIME'].includes(s)) return 'H';
    if (['LATE', 'TERLAMBAT'].includes(s)) return 'T';
    if (['PERMISSION', 'IZIN'].includes(s)) return 'I';
    if (['SICK', 'SAKIT'].includes(s)) return 'S';
    if (['ALPHA', 'ABSENT', 'ALPA'].includes(s)) return 'A';
    return '?';
}

const TAHFIDZ_DISPLAY = { present: 'H', permission: 'I', sick: 'S', absent: 'A' };
const LESSON_DISPLAY = {
    HADIR: 'H', TERLAMBAT: 'T', IZIN: 'I', SAKIT: 'S', ALPA: 'A',
    NOT_RECORDED: '-', MISSING_DETAIL: '?', CANCELLED: 'X', UPCOMING: '◷', SOURCE_ERROR: '?'
};

function logFailure(operation, errorCode, error, ctx) {
    logger.error(error.message, {
        module: 'lesson-attendance',
        feature: 'integrated-daily-report',
        operation,
        request_id: ctx.requestId || null,
        user_id: ctx.userId || null,
        academic_year_id: ctx.academicYearId || null,
        class_id: ctx.classId || null,
        attendance_date: ctx.attendanceDate || null,
        error_code: errorCode,
        error_message: error.message,
        timestamp: new Date().toISOString(),
        stack: error.stack
    });
}

class IntegratedDailyReportService {
    // ------------------------------------------------------------------ params & scope
    async normalizeParams(query = {}) {
        const { attendanceDate: today, currentTime, timezone } = lessonAttendanceService.getServerDateTimeInTimezone();
        const attendanceDate = query.attendance_date || today;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(attendanceDate)) || Number.isNaN(Date.parse(`${attendanceDate}T00:00:00Z`))) {
            throw new AppError('Format tanggal harus YYYY-MM-DD.', 422, ERROR_CODES.INVALID_ATTENDANCE_DATE);
        }
        if (attendanceDate > today) {
            throw new AppError('Tanggal laporan tidak boleh melebihi tanggal hari ini.', 422, ERROR_CODES.INVALID_ATTENDANCE_DATE);
        }

        const classId = Number(query.class_id);
        if (!query.class_id || !Number.isInteger(classId) || classId <= 0) {
            throw new AppError('Kelas wajib dipilih.', 422, ERROR_CODES.INVALID_CLASS);
        }

        let year;
        if (query.academic_year_id) {
            const yid = Number(query.academic_year_id);
            if (!Number.isInteger(yid) || yid <= 0) {
                throw new AppError('Tahun ajaran tidak valid.', 422, ERROR_CODES.INVALID_ACADEMIC_YEAR);
            }
            year = await AcademicYear.findByPk(yid, { attributes: ['id', 'name', 'start_date', 'end_date', 'is_active'] });
            if (!year) throw new AppError('Tahun ajaran tidak ditemukan.', 404, ERROR_CODES.INVALID_ACADEMIC_YEAR);
        } else {
            year = await AcademicYear.findOne({
                where: { is_active: true },
                attributes: ['id', 'name', 'start_date', 'end_date', 'is_active'],
                order: [['id', 'ASC']]
            });
            if (!year) throw new AppError('Tahun ajaran aktif belum dikonfigurasi.', 409, ERROR_CODES.ACTIVE_ACADEMIC_YEAR_NOT_FOUND);
        }
        if ((year.start_date && attendanceDate < dateKey(year.start_date)) ||
            (year.end_date && attendanceDate > dateKey(year.end_date))) {
            throw new AppError('Tanggal laporan berada di luar rentang tahun ajaran yang dipilih.', 422, ERROR_CODES.INVALID_ATTENDANCE_DATE);
        }

        const search = query.search ? String(query.search).trim() : '';
        if (search.length > MAX_SEARCH_LENGTH) {
            throw new AppError(`Pencarian maksimal ${MAX_SEARCH_LENGTH} karakter.`, 422, ERROR_CODES.VALIDATION_ERROR);
        }
        const findingCategory = query.finding_category ? String(query.finding_category).toUpperCase() : '';
        if (findingCategory && !FINDING_CATEGORIES.includes(findingCategory)) {
            throw new AppError('Kategori temuan tidak valid.', 422, ERROR_CODES.VALIDATION_ERROR);
        }
        const findingCode = query.finding_code ? String(query.finding_code).toUpperCase() : '';
        if (findingCode && !FINDING_CODES.includes(findingCode)) {
            throw new AppError('Kode temuan tidak valid.', 422, ERROR_CODES.VALIDATION_ERROR);
        }

        return {
            today,
            currentTime,
            currentMin: toMin(currentTime),
            timezone: timezone || DEFAULT_TIMEZONE,
            attendance_date: attendanceDate,
            academic_year: { id: year.id, name: year.name, is_active: Boolean(year.is_active) },
            is_today: attendanceDate === today,
            is_today_active: attendanceDate === today && Boolean(year.is_active),
            class_id: classId,
            search,
            finding_category: findingCategory,
            finding_code: findingCode
        };
    }

    /**
     * Class scope. Admin/kesiswaan/tatib/superadmin: all classes. Other roles holding the
     * permission (e.g. wali kelas): only classes where they are the homeroom teacher.
     */
    async resolveClassScope(userId) {
        const user = await User.findByPk(userId, {
            attributes: ['id'],
            include: [{ model: Role, as: 'roles', attributes: ['name'], through: { attributes: [] } }]
        });
        if (!user) throw new AppError('Pengguna tidak ditemukan.', 401, 'UNAUTHORIZED');
        const names = (user.roles || []).map((r) => String(r.name).toUpperCase());
        if (names.some((n) => PRIVILEGED_ROLES.has(n))) {
            return { all_classes: true, class_ids: [], privileged: true };
        }
        const teacher = await Teacher.findOne({ where: { user_id: userId }, attributes: ['id'] });
        if (!teacher) return { all_classes: false, class_ids: [], privileged: false };
        const rows = await db.sequelize.query(
            'SELECT id FROM classes WHERE homeroom_teacher_id = :tid',
            { replacements: { tid: teacher.id }, type: QueryTypes.SELECT }
        );
        return { all_classes: false, class_ids: rows.map((r) => Number(r.id)), privileged: false };
    }

    // --------------------------------------------------------------------- main builder
    /**
     * Shared report builder used by UI, Excel and PDF.
     * @param {object} query
     * @param {{ userId?: number, requestId?: string, applyViewFilters?: boolean }} options
     */
    async buildReport(query = {}, options = {}) {
        const ctxLog = { requestId: options.requestId, userId: options.userId };
        const params = await this.normalizeParams(query);
        Object.assign(ctxLog, {
            academicYearId: params.academic_year.id, classId: params.class_id, attendanceDate: params.attendance_date
        });

        const scope = await this.resolveClassScope(options.userId).catch((err) => {
            if (err instanceof AppError) throw err;
            logFailure('resolveClassScope', ERROR_CODES.CLASS_ACCESS_DENIED, err, ctxLog);
            throw new AppError('Gagal memeriksa hak akses kelas.', 500, ERROR_CODES.INTERNAL_ERROR);
        });
        if (!scope.all_classes && !scope.class_ids.includes(params.class_id)) {
            throw new AppError('Anda tidak memiliki akses ke kelas ini.', 403, ERROR_CODES.CLASS_ACCESS_DENIED);
        }

        try {
            const classInfo = await this._loadClass(params.class_id);
            if (!classInfo) throw new AppError('Kelas tidak ditemukan.', 404, ERROR_CODES.INVALID_CLASS);

            // 1. Roster (failure here is fatal: nothing can be reported without a roster)
            let roster;
            try {
                roster = await this._resolveRoster(params);
            } catch (err) {
                logFailure('resolveRoster', ERROR_CODES.STUDENT_ROSTER_RESOLUTION_FAILED, err, ctxLog);
                throw new AppError('Gagal menentukan daftar siswa kelas.', 500, ERROR_CODES.STUDENT_ROSTER_RESOLUTION_FAILED);
            }
            const studentIds = roster.map((r) => Number(r.student_id));

            // 2. Batch sources, isolated so one failure never masquerades as "not recorded"
            const sourceErrors = {};
            const settle = async (key, code, fn, fallback) => {
                try {
                    return await fn();
                } catch (err) {
                    logFailure(`load_${key}`, code, err, ctxLog);
                    sourceErrors[key] = code;
                    return fallback;
                }
            };
            const [gateRows, tahfidzRows, lessonData, permissionData, templatePeriods] = await Promise.all([
                settle('gate', ERROR_CODES.GATE_ATTENDANCE_QUERY_FAILED, () => this._loadGate(params, studentIds), []),
                settle('tahfidz', ERROR_CODES.TAHFIDZ_ATTENDANCE_QUERY_FAILED, () => this._loadTahfidz(params, studentIds), []),
                settle('lesson', ERROR_CODES.LESSON_ATTENDANCE_QUERY_FAILED, () => this._loadLessons(params, studentIds), { sessions: [], details: [], otherClass: [] }),
                settle('permission', ERROR_CODES.INTEGRATED_REPORT_GENERATION_FAILED, () => this._loadPermissions(params, studentIds), { leaves: [], letters: [] }),
                this._loadTemplatePeriods(params).catch((err) => {
                    logFailure('load_periods', ERROR_CODES.LESSON_ATTENDANCE_QUERY_FAILED, err, ctxLog);
                    sourceErrors.periods = ERROR_CODES.LESSON_ATTENDANCE_QUERY_FAILED;
                    return [];
                })
            ]);
            const sources = {
                gate: !sourceErrors.gate,
                tahfidz: !sourceErrors.tahfidz,
                lesson: !sourceErrors.lesson && !sourceErrors.periods
            };

            // 3. Periods (dynamic columns)
            const validSessions = lessonData.sessions.filter((s) => !s.cancelled_at);
            const cancelledSessions = lessonData.sessions.filter((s) => s.cancelled_at);
            const periods = this._buildPeriods(templatePeriods, validSessions);

            // 4. Index sources by student
            const gateByStudent = new Map();
            const gateDup = new Set();
            for (const g of gateRows) {
                if (gateByStudent.has(g.student_id)) gateDup.add(g.student_id);
                else gateByStudent.set(g.student_id, g); // rows ordered newest id first
            }
            const tahfidzByStudent = new Map();
            const tahfidzDup = new Set();
            for (const t of tahfidzRows) {
                if (tahfidzByStudent.has(t.student_id)) tahfidzDup.add(t.student_id);
                else tahfidzByStudent.set(t.student_id, t);
            }
            const sessionByPeriod = new Map();
            let duplicateSessions = 0;
            for (const s of validSessions) {
                const k = Number(s.period_number);
                if (sessionByPeriod.has(k)) duplicateSessions += 1;
                else sessionByPeriod.set(k, s);
            }
            const cancelledByPeriod = new Map();
            for (const s of cancelledSessions) cancelledByPeriod.set(Number(s.period_number), s);
            const detailMap = new Map();
            for (const d of lessonData.details) detailMap.set(`${d.session_id}:${d.student_id}`, d);
            const otherClassCount = new Map();
            for (const o of lessonData.otherClass) {
                otherClassCount.set(o.student_id, (otherClassCount.get(o.student_id) || 0) + Number(o.total || 1));
            }
            const permissionsByStudent = this._indexPermissions(permissionData);

            // 5. Student rows
            const students = roster.map((r) => this._buildStudentRow({
                r, params, periods, sources, sourceErrors,
                gate: gateByStudent.get(r.student_id),
                tahfidz: tahfidzByStudent.get(r.student_id),
                sessionByPeriod, cancelledByPeriod, detailMap,
                otherClass: otherClassCount.get(r.student_id) || 0,
                permissions: permissionsByStudent.get(r.student_id) || [],
                privileged: scope.privileged
            }));

            // 6. Analysis (shared engine)
            const tahfidzHasAnyRecord = students.some((s) => s.tahfidz.record);
            const tahfidzHasPresent = students.some((s) => s.tahfidz.status === 'present');
            const classWideEmpty = students.length > 0 && students.every((s) =>
                !s.gate.record && !s.tahfidz.record &&
                !s.lessons.some((c) => ['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA'].includes(c.status)));
            const analysisCtx = {
                reportDate: params.attendance_date,
                isToday: params.is_today,
                currentMin: params.currentMin,
                periods,
                sources,
                tahfidzHasAnyRecord,
                gateHasAnyRecord: students.some((s) => s.gate.record),
                gateHasAnyExit: students.some((s) => s.gate.clock_out !== null),
                tahfidzApplicable: tahfidzHasPresent,
                classWideEmpty
            };
            let results;
            try {
                results = analysisService.analyzeClass(students, analysisCtx);
            } catch (err) {
                logFailure('analyze', ERROR_CODES.ATTENDANCE_ANALYSIS_FAILED, err, ctxLog);
                throw new AppError('Gagal menganalisis data presensi.', 500, ERROR_CODES.ATTENDANCE_ANALYSIS_FAILED);
            }
            for (const st of students) {
                const { findings, analysis } = results.get(st.student_id);
                st.findings = findings;
                st.finding_count = findings.filter((f) => f.category !== CATEGORY.INCOMPLETE_DATA).length;
                st.needs_verification = findings.some((f) => f.verification_required);
                st.potential_truancy = Boolean(analysis.potential_truancy);
                st.potential_truancy_periods = analysis.potential_truancy_periods;
                st.lesson_summary = {
                    hadir: analysis.summary.hadir,
                    terlambat: analysis.summary.terlambat,
                    izin: analysis.summary.izin,
                    sakit: analysis.summary.sakit,
                    alpa: analysis.summary.alpa
                };
                st.flags = {
                    has_potential_violation: findings.some((f) => f.category === CATEGORY.POTENTIAL_VIOLATION),
                    has_inconsistency: findings.some((f) => f.category === CATEGORY.INCONSISTENCY),
                    potential_truancy: st.potential_truancy,
                    tahfidz_not_recorded: sources.tahfidz && !st.tahfidz.record,
                    tahfidz_absent: st.tahfidz.status === 'absent',
                    gate_not_recorded: sources.gate && !st.gate.record,
                    early_departure: findings.some((f) => f.finding_code === 'POTENTIAL_EARLY_DEPARTURE')
                };
            }

            // 7. Summary, completeness, warnings
            const summary = this._buildSummary(students);
            const completeness = this._buildCompleteness({ students, periods, params, sources, validSessions });
            const warnings = this._buildWarnings({
                params, classInfo, students, periods, sources, sourceErrors, completeness,
                tahfidzHasAnyRecord, tahfidzHasPresent, classWideEmpty, roster,
                duplicateSessions, gateDup: gateDup.size, tahfidzDup: tahfidzDup.size,
                missingDetail: students.reduce((n, s) => n + s.lessons.filter((c) => c.status === 'MISSING_DETAIL').length, 0),
                usedShifts: students.map((s) => s.gate.shift).filter(Boolean)
            });
            const isProvisional = this._isProvisional(params, periods, students);
            if (isProvisional) {
                warnings.unshift({
                    code: 'PROVISIONAL_REPORT', level: 'warning', scope: 'CLASS',
                    message: 'Laporan sementara — kegiatan sekolah masih berlangsung.'
                });
            }

            // 8. Optional view-only filters (never applied to exports)
            let visible = students;
            if (options.applyViewFilters !== false) {
                visible = students.filter((s) => {
                    if (params.search) {
                        const q = params.search.toLowerCase();
                        if (!s.student_name.toLowerCase().includes(q) && !String(s.nis || '').toLowerCase().includes(q)) return false;
                    }
                    if (params.finding_category && !s.findings.some((f) => f.category === params.finding_category)) return false;
                    if (params.finding_code && !s.findings.some((f) => f.finding_code === params.finding_code)) return false;
                    return true;
                });
            }

            const generatedAt = new Date().toISOString();
            return {
                report_date: params.attendance_date,
                generated_at: generatedAt,
                timezone: params.timezone,
                is_today: params.is_today,
                is_provisional: isProvisional,
                is_historical_mode: !params.is_today_active,
                academic_year: params.academic_year,
                class: {
                    id: classInfo.id,
                    name: classInfo.name,
                    grade_name: classInfo.grade_name,
                    grade_level: classInfo.grade_level,
                    department_name: classInfo.department_name,
                    homeroom_teacher_name: classInfo.homeroom_teacher_name,
                    homeroom_is_current: !params.is_today_active,
                    student_count: students.length
                },
                periods,
                summary,
                completeness,
                students: visible.map((s) => this._serializeStudent(s)),
                filtered_count: visible.length,
                findings_table: this.buildFindingsTable(visible),
                warnings,
                disclaimer: DISCLAIMER,
                source_errors: sourceErrors,
                applied_filters: {
                    academic_year_id: params.academic_year.id,
                    attendance_date: params.attendance_date,
                    class_id: params.class_id,
                    search: params.search,
                    finding_category: params.finding_category,
                    finding_code: params.finding_code
                }
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logFailure('buildReport', ERROR_CODES.INTEGRATED_REPORT_GENERATION_FAILED, error, ctxLog);
            throw new AppError('Gagal memuat laporan harian terpadu.', 500, ERROR_CODES.INTEGRATED_REPORT_GENERATION_FAILED);
        }
    }

    // ------------------------------------------------------------------------- loaders
    async _loadClass(classId) {
        const rows = await db.sequelize.query(
            `SELECT c.id, c.name, g.name AS grade_name, g.level AS grade_level,
                    d.name AS department_name, t.full_name AS homeroom_teacher_name
             FROM classes c
             LEFT JOIN grades g ON g.id = c.grade_id
             LEFT JOIN departments d ON d.id = c.department_id
             LEFT JOIN teachers t ON t.id = c.homeroom_teacher_id
             WHERE c.id = :classId LIMIT 1`,
            { replacements: { classId }, type: QueryTypes.SELECT }
        );
        return rows[0] || null;
    }

    async _resolveRoster(params) {
        const replacements = {
            academic_year_id: params.academic_year.id,
            class_id: params.class_id,
            attendance_date: params.attendance_date
        };
        if (params.is_today_active) {
            // Latest assignment per student in the academic year is determined FIRST,
            // the class filter is applied afterwards so moved students never remain in the old class.
            const rows = await db.sequelize.query(
                `WITH ranked AS (
                    SELECT sch.student_id, sch.class_id,
                           ROW_NUMBER() OVER (PARTITION BY sch.student_id ORDER BY sch.created_at DESC, sch.id DESC) AS rn
                    FROM student_class_history sch
                    WHERE sch.academic_year_id = :academic_year_id
                 )
                 SELECT st.id AS student_id, st.nis, st.full_name AS student_name, st.student_status
                 FROM ranked r
                 INNER JOIN students st ON st.id = r.student_id
                 WHERE r.rn = 1 AND r.class_id = :class_id AND st.student_status = 'ACTIVE'
                 ORDER BY st.full_name ASC, st.id ASC`,
                { replacements, type: QueryTypes.SELECT }
            );
            return rows.map((r) => ({ ...r, roster_source: 'ACTIVE_ROSTER' }));
        }
        // Historical: only memberships that can be proven (transactions on that date, or an
        // unambiguous single class assignment within the year). No silent fallback to today's roster.
        const rows = await db.sequelize.query(
            `SELECT x.student_id, x.source, st.nis, st.full_name AS student_name, st.student_status
             FROM (
                SELECT a.student_id, 'TRANSACTION' AS source FROM student_daily_attendances a
                  WHERE a.attendance_date = :attendance_date AND a.academic_year_id = :academic_year_id AND a.class_id = :class_id
                UNION
                SELECT t.student_id, 'TRANSACTION' FROM student_tahfidz_attendances t
                  WHERE t.attendance_date = :attendance_date AND t.class_id = :class_id
                UNION
                SELECT lad.student_id, 'TRANSACTION' FROM lesson_attendance_details lad
                  INNER JOIN lesson_attendance_sessions s ON s.id = lad.session_id
                  WHERE s.attendance_date = :attendance_date AND s.academic_year_id = :academic_year_id
                    AND s.class_id = :class_id AND s.cancelled_at IS NULL
                UNION
                SELECT sch.student_id, 'HISTORY' FROM student_class_history sch
                  WHERE sch.academic_year_id = :academic_year_id AND sch.class_id = :class_id
                    AND NOT EXISTS (
                        SELECT 1 FROM student_class_history o
                        WHERE o.student_id = sch.student_id AND o.academic_year_id = :academic_year_id AND o.class_id <> :class_id
                    )
             ) x
             INNER JOIN students st ON st.id = x.student_id
             ORDER BY st.full_name ASC, st.id ASC`,
            { replacements, type: QueryTypes.SELECT }
        );
        const byStudent = new Map();
        for (const r of rows) {
            const prev = byStudent.get(r.student_id);
            if (!prev || r.source === 'TRANSACTION') {
                byStudent.set(r.student_id, { ...r, roster_source: r.source === 'TRANSACTION' ? 'TRANSACTION' : 'HISTORY' });
            }
        }
        return [...byStudent.values()].sort((a, b) =>
            String(a.student_name).localeCompare(String(b.student_name), 'id') || a.student_id - b.student_id);
    }

    async _loadGate(params, studentIds) {
        if (!studentIds.length) return [];
        return db.sequelize.query(
            `SELECT a.id, a.student_id, a.class_id, a.shift_id, a.clock_in_at, a.clock_out_at,
                    a.clock_in_method, a.clock_out_method, a.entry_status, a.exit_status,
                    a.attendance_status, a.late_minutes, a.note,
                    sh.name AS shift_name, sh.clock_out_start, sh.clock_out_end, sh.allow_checkout,
                    sh.updated_at AS shift_updated_at
             FROM student_daily_attendances a
             LEFT JOIN student_attendance_shifts sh ON sh.id = a.shift_id
             WHERE a.attendance_date = :attendance_date
               AND a.academic_year_id = :academic_year_id
               AND a.student_id IN (:studentIds)
             ORDER BY a.id DESC`,
            {
                replacements: { attendance_date: params.attendance_date, academic_year_id: params.academic_year.id, studentIds },
                type: QueryTypes.SELECT
            }
        );
    }

    async _loadTahfidz(params, studentIds) {
        if (!studentIds.length) return [];
        return db.sequelize.query(
            `SELECT id, student_id, class_id, status, notes, created_by, created_at, updated_at
             FROM student_tahfidz_attendances
             WHERE attendance_date = :attendance_date AND student_id IN (:studentIds)
             ORDER BY id DESC`,
            { replacements: { attendance_date: params.attendance_date, studentIds }, type: QueryTypes.SELECT }
        );
    }

    async _loadLessons(params, studentIds) {
        const sessions = await db.sequelize.query(
            `SELECT s.id, s.class_id, s.teacher_id, t.full_name AS teacher_name, s.subject_id, sub.name AS subject_name,
                    s.lesson_period_id, s.period_number, s.period_start_time, s.period_end_time,
                    s.input_method, s.cancelled_at, s.created_at
             FROM lesson_attendance_sessions s
             INNER JOIN teachers t ON t.id = s.teacher_id
             INNER JOIN subjects sub ON sub.id = s.subject_id
             WHERE s.academic_year_id = :academic_year_id AND s.attendance_date = :attendance_date AND s.class_id = :class_id
             ORDER BY s.period_number ASC, s.id ASC`,
            {
                replacements: { academic_year_id: params.academic_year.id, attendance_date: params.attendance_date, class_id: params.class_id },
                type: QueryTypes.SELECT
            }
        );
        const validIds = sessions.filter((s) => !s.cancelled_at).map((s) => s.id);
        const details = validIds.length
            ? await db.sequelize.query(
                'SELECT id, session_id, student_id, status, notes FROM lesson_attendance_details WHERE session_id IN (:validIds)',
                { replacements: { validIds }, type: QueryTypes.SELECT }
            )
            : [];
        const otherClass = studentIds.length
            ? await db.sequelize.query(
                `SELECT lad.student_id, COUNT(*) AS total
                 FROM lesson_attendance_details lad
                 INNER JOIN lesson_attendance_sessions s ON s.id = lad.session_id
                 WHERE s.attendance_date = :attendance_date AND s.academic_year_id = :academic_year_id
                   AND s.class_id <> :class_id AND s.cancelled_at IS NULL AND lad.student_id IN (:studentIds)
                 GROUP BY lad.student_id`,
                {
                    replacements: {
                        attendance_date: params.attendance_date, academic_year_id: params.academic_year.id,
                        class_id: params.class_id, studentIds
                    },
                    type: QueryTypes.SELECT
                }
            )
            : [];
        return { sessions, details, otherClass };
    }

    async _loadPermissions(params, studentIds) {
        if (!studentIds.length) return { leaves: [], letters: [] };
        const [leaves, letters] = await Promise.all([
            db.sequelize.query(
                `SELECT id, student_id, leave_type, start_date, end_date
                 FROM student_leave_requests
                 WHERE LOWER(status) = 'approved' AND start_date <= :d AND end_date >= :d AND student_id IN (:studentIds)`,
                { replacements: { d: params.attendance_date, studentIds }, type: QueryTypes.SELECT }
            ),
            db.sequelize.query(
                `SELECT pl.id, pl.code, pl.activity_name, pl.start_time, pl.end_time, pls.student_id
                 FROM permission_letters pl
                 INNER JOIN permission_letter_students pls ON pls.permission_letter_id = pl.id
                 WHERE UPPER(pl.status) = 'APPROVED' AND pl.start_date <= :d AND pl.end_date >= :d
                   AND pls.student_id IN (:studentIds)`,
                { replacements: { d: params.attendance_date, studentIds }, type: QueryTypes.SELECT }
            )
        ]);
        return { leaves, letters };
    }

    async _loadTemplatePeriods(params) {
        try {
            const info = await lessonAttendanceService.getAvailableLessonPeriods(params.currentTime);
            return info.periods.map((p) => (p.get ? p.get({ plain: true }) : p));
        } catch (err) {
            if (err.errorCode === ERROR_CODES.LESSON_PERIOD_TEMPLATE_NOT_FOUND) return [];
            throw err;
        }
    }

    // ------------------------------------------------------------------------ builders
    _buildPeriods(templatePeriods, validSessions) {
        const map = new Map();
        for (const p of templatePeriods) {
            map.set(Number(p.period_number), {
                period_number: Number(p.period_number),
                period_order: Number(p.period_order ?? p.period_number),
                label: `J${p.period_number}`,
                name: p.name,
                start_time: hm(p.start_time),
                end_time: hm(p.end_time),
                start_min: toMin(p.start_time),
                end_min: toMin(p.end_time),
                from_template: true,
                subject_name: null,
                teacher_name: null
            });
        }
        // Historical snapshot times from actual sessions take precedence over the current template.
        for (const s of validSessions) {
            const pn = Number(s.period_number);
            const existing = map.get(pn);
            const snap = {
                start_time: hm(s.period_start_time),
                end_time: hm(s.period_end_time),
                start_min: toMin(s.period_start_time),
                end_min: toMin(s.period_end_time)
            };
            if (existing) {
                Object.assign(existing, snap);
                if (!existing.subject_name) { existing.subject_name = s.subject_name; existing.teacher_name = s.teacher_name; }
            } else {
                map.set(pn, {
                    period_number: pn, period_order: pn, label: `J${pn}`, name: `Jam ke-${pn}`,
                    ...snap, from_template: false, subject_name: s.subject_name, teacher_name: s.teacher_name
                });
            }
        }
        return [...map.values()].sort((a, b) => a.period_order - b.period_order || a.period_number - b.period_number);
    }

    _indexPermissions({ leaves, letters }) {
        const map = new Map();
        const add = (sid, p) => {
            if (!map.has(sid)) map.set(sid, []);
            map.get(sid).push(p);
        };
        for (const l of leaves) {
            add(l.student_id, {
                kind: 'LEAVE', source_id: l.id, label: `Izin ${l.leave_type || ''}`.trim(),
                whole_day: true, start_min: 0, end_min: 1440
            });
        }
        for (const l of letters) {
            const s = toMin(l.start_time);
            const e = toMin(l.end_time);
            // Letters without a time window are informational only: never assumed to cover a whole day.
            if (s === null || e === null) continue;
            add(l.student_id, {
                kind: 'LETTER', source_id: l.id,
                label: `Surat izin ${l.code || ''} ${l.activity_name || ''} ${hm(l.start_time)}–${hm(l.end_time)}`.replace(/\s+/g, ' ').trim(),
                whole_day: false, start_min: s, end_min: e
            });
        }
        return map;
    }

    _buildStudentRow(c) {
        const { r, params, periods, sources, gate, tahfidz, permissions } = c;
        const tz = params.timezone;

        // Gate -------------------------------------------------------------------
        let gateOut = {
            record: false, source_error: !sources.gate,
            clock_in: null, clock_out: null, clock_in_min: null, clock_out_min: null,
            entry_status: null, exit_status: null, attendance_status: null, late_minutes: 0,
            display_status: null, clock_in_method: null, clock_out_method: null, note: null,
            shift: null, class_mismatch: false, record_id: null
        };
        if (gate) {
            const clockIn = formatClock(gate.clock_in_at, tz);
            const clockOut = formatClock(gate.clock_out_at, tz);
            let display = normalizeGateStatus(gate.attendance_status);
            if (clockIn && !['I', 'S', 'A'].includes(display)) {
                display = String(gate.entry_status || '').toUpperCase() === 'LATE' || Number(gate.late_minutes) > 0 ? 'T' : (display || 'H');
            }
            const shiftConfigReliable = gate.shift_id
                ? (params.is_today || !gate.shift_updated_at || dateKey(gate.shift_updated_at) <= params.attendance_date)
                : false;
            gateOut = {
                record: true,
                source_error: false,
                record_id: gate.id,
                clock_in: clockIn,
                clock_out: clockOut,
                clock_in_min: toMin(clockIn),
                clock_out_min: toMin(clockOut),
                entry_status: gate.entry_status || null,
                exit_status: gate.exit_status || null,
                attendance_status: gate.attendance_status || null,
                late_minutes: Number(gate.late_minutes) || 0,
                display_status: display,
                clock_in_method: gate.clock_in_method || null,
                clock_out_method: gate.clock_out_method || null,
                note: gate.note || null,
                class_mismatch: gate.class_id !== null && gate.class_id !== undefined && Number(gate.class_id) !== params.class_id,
                shift: gate.shift_id ? {
                    id: gate.shift_id,
                    name: gate.shift_name || null,
                    clock_out_start_min: toMin(gate.clock_out_start),
                    clock_out_end_min: toMin(gate.clock_out_end),
                    allow_checkout: Boolean(gate.allow_checkout),
                    config_reliable: shiftConfigReliable
                } : null
            };
        }

        // Tahfidz ----------------------------------------------------------------
        let thfOut = { record: false, source_error: !sources.tahfidz, status: null, display_status: sources.tahfidz ? '-' : '?', class_mismatch: false, record_id: null };
        if (tahfidz) {
            thfOut = {
                record: true,
                source_error: false,
                record_id: tahfidz.id,
                status: tahfidz.status,
                display_status: TAHFIDZ_DISPLAY[tahfidz.status] || '?',
                notes: tahfidz.notes || null,
                recorded_at: formatDateTimeIso(tahfidz.created_at),
                recorded_by: c.privileged ? (tahfidz.created_by || null) : null,
                class_mismatch: tahfidz.class_id !== null && tahfidz.class_id !== undefined && Number(tahfidz.class_id) !== params.class_id
            };
        }

        // Lessons ----------------------------------------------------------------
        const lessons = periods.map((p) => {
            const base = {
                period_number: p.period_number,
                period_start_time: p.start_time,
                period_end_time: p.end_time,
                start_min: p.start_min,
                end_min: p.end_min,
                permission_covered: false,
                permission_label: null
            };
            let cell;
            if (!sources.lesson) {
                cell = { ...base, status: 'SOURCE_ERROR', session_id: null };
            } else {
                const sess = c.sessionByPeriod.get(p.period_number);
                const canc = c.cancelledByPeriod.get(p.period_number);
                if (sess) {
                    const d = c.detailMap.get(`${sess.id}:${r.student_id}`);
                    cell = {
                        ...base,
                        status: d ? d.status : 'MISSING_DETAIL',
                        session_id: String(sess.id),
                        notes: d?.notes || '',
                        subject_name: sess.subject_name,
                        teacher_name: sess.teacher_name,
                        input_method: sess.input_method,
                        submitted_at: formatDateTimeIso(sess.created_at),
                        period_start_time: hm(sess.period_start_time) || p.start_time,
                        period_end_time: hm(sess.period_end_time) || p.end_time,
                        start_min: toMin(sess.period_start_time) ?? p.start_min,
                        end_min: toMin(sess.period_end_time) ?? p.end_min
                    };
                } else if (canc) {
                    cell = { ...base, status: 'CANCELLED', session_id: String(canc.id) };
                } else if (params.is_today && p.start_min !== null && p.start_min > params.currentMin) {
                    cell = { ...base, status: 'UPCOMING', session_id: null };
                } else {
                    cell = { ...base, status: 'NOT_RECORDED', session_id: null };
                }
            }
            if (cell.status === 'ALPA') {
                const hit = permissions.find((pm) => cell.start_min !== null &&
                    pm.start_min < cell.end_min && pm.end_min > cell.start_min);
                if (hit) { cell.permission_covered = true; cell.permission_label = hit.label; }
            }
            cell.display_status = LESSON_DISPLAY[cell.status] || '-';
            return cell;
        });

        return {
            student_id: Number(r.student_id),
            nis: r.nis === null || r.nis === undefined ? null : String(r.nis),
            student_name: r.student_name,
            roster_source: r.roster_source,
            gate: gateOut,
            tahfidz: thfOut,
            lessons,
            permissions,
            other_class_lessons: c.otherClass,
            findings: [],
            finding_count: 0
        };
    }

    _serializeStudent(s) {
        return {
            student_id: s.student_id,
            nis: s.nis,
            student_name: s.student_name,
            roster_source: s.roster_source,
            gate: {
                record: s.gate.record,
                source_error: s.gate.source_error,
                clock_in: s.gate.clock_in,
                clock_out: s.gate.clock_out,
                entry_status: s.gate.entry_status,
                exit_status: s.gate.exit_status,
                attendance_status: s.gate.attendance_status,
                late_minutes: s.gate.late_minutes,
                display_status: s.gate.display_status,
                clock_in_method: s.gate.clock_in_method,
                clock_out_method: s.gate.clock_out_method,
                note: s.gate.note,
                shift_name: s.gate.shift?.name || null,
                class_mismatch: s.gate.class_mismatch
            },
            tahfidz: {
                record: s.tahfidz.record,
                source_error: s.tahfidz.source_error,
                status: s.tahfidz.status,
                display_status: s.tahfidz.display_status,
                notes: s.tahfidz.notes || null,
                recorded_at: s.tahfidz.recorded_at || null,
                recorded_by: s.tahfidz.recorded_by || null,
                class_mismatch: s.tahfidz.class_mismatch
            },
            lessons: s.lessons.map((c) => ({
                period_number: c.period_number,
                status: c.status,
                display_status: c.display_status,
                period_start_time: c.period_start_time,
                period_end_time: c.period_end_time,
                session_id: c.session_id || null,
                subject_name: c.subject_name || null,
                teacher_name: c.teacher_name || null,
                input_method: c.input_method || null,
                submitted_at: c.submitted_at || null,
                notes: c.notes || '',
                permission_covered: c.permission_covered,
                permission_label: c.permission_label
            })),
            lesson_summary: s.lesson_summary,
            permissions: s.permissions.map((p) => ({ kind: p.kind, label: p.label, whole_day: p.whole_day })),
            potential_truancy: s.potential_truancy,
            flags: s.flags,
            finding_count: s.finding_count,
            findings: s.findings.map((f) => ({
                finding_code: f.finding_code,
                category: f.category,
                title: f.title,
                description: f.description,
                affected_periods: f.affected_periods,
                evidence: f.evidence,
                source_module: f.source_module,
                source_record_ids: f.source_record_ids,
                related_codes: f.related_codes,
                verification_required: f.verification_required
            }))
        };
    }

    /** One row per student; shared by UI, PDF and Excel. Incomplete-data findings are excluded (see warnings). */
    buildFindingsTable(students) {
        const rows = [];
        for (const s of students) {
            const potential = s.findings.filter((f) => f.category === CATEGORY.POTENTIAL_VIOLATION);
            const inconsistent = s.findings.filter((f) => f.category === CATEGORY.INCONSISTENCY);
            if (!potential.length && !inconsistent.length) continue;
            rows.push({
                student_id: s.student_id,
                nis: s.nis,
                student_name: s.student_name,
                potential: potential.map((f) => ({ finding_code: f.finding_code, title: f.title, description: f.description, affected_periods: f.affected_periods, evidence: f.evidence })),
                inconsistencies: inconsistent.map((f) => ({ finding_code: f.finding_code, title: f.title, description: f.description, affected_periods: f.affected_periods, evidence: f.evidence }))
            });
        }
        return rows;
    }

    _buildSummary(students) {
        const count = (fn) => students.filter(fn).length;
        return {
            total_students: students.length,
            gate_entry_recorded: count((s) => s.gate.clock_in !== null),
            gate_late_entry: count((s) => s.gate.clock_in !== null && (s.gate.late_minutes > 0 || s.gate.display_status === 'T')),
            tahfidz_present: count((s) => s.tahfidz.status === 'present'),
            tahfidz_absent: count((s) => s.tahfidz.status === 'absent'),
            students_with_lesson_alpa: count((s) => s.lesson_summary.alpa > 0),
            students_potential_truancy: count((s) => s.potential_truancy),
            students_needing_verification: new Set(students.filter((s) => s.needs_verification).map((s) => s.student_id)).size,
            total_findings: students.reduce((n, s) => n + s.finding_count, 0)
        };
    }

    _buildCompleteness({ students, periods, params, sources, validSessions }) {
        const total = students.length;
        const periodNumbersRecorded = new Set(validSessions.map((s) => Number(s.period_number)));
        const relevantPeriods = params.is_today
            ? periods.filter((p) => p.start_min === null || p.start_min <= params.currentMin)
            : periods;
        return {
            total_students: total,
            gate_entry_records: sources.gate ? students.filter((s) => s.gate.clock_in !== null).length : null,
            gate_exit_records: sources.gate ? students.filter((s) => s.gate.clock_out !== null).length : null,
            gate_records: sources.gate ? students.filter((s) => s.gate.record).length : null,
            tahfidz_records: sources.tahfidz ? students.filter((s) => s.tahfidz.record).length : null,
            lesson_periods_recorded: sources.lesson ? periods.filter((p) => periodNumbersRecorded.has(p.period_number)).length : null,
            lesson_periods_total: periods.length,
            lesson_periods_started: relevantPeriods.length
        };
    }

    _isProvisional(params, periods, students) {
        if (!params.is_today) return false;
        const now = params.currentMin;
        const periodOngoing = periods.some((p) => p.end_min !== null && p.end_min > now);
        const checkoutOpen = students.some((s) => s.gate.shift && s.gate.shift.clock_out_end_min !== null && s.gate.shift.clock_out_end_min > now);
        return periodOngoing || checkoutOpen;
    }

    _buildWarnings(c) {
        const w = [];
        const add = (code, level, message, extra = {}) => w.push({ code, level, scope: 'CLASS', message, ...extra });
        const { params, sources, sourceErrors, students, completeness } = c;

        if (sourceErrors.gate) add('SOURCE_ERROR_GATE', 'error', 'Data presensi gerbang gagal dimuat karena kesalahan teknis. Kolom gerbang tidak boleh dianggap "tidak tercatat" dan temuan terkait gerbang tidak dihasilkan.');
        if (sourceErrors.tahfidz) add('SOURCE_ERROR_TAHFIDZ', 'error', 'Data presensi Tahfidz gagal dimuat karena kesalahan teknis. Temuan terkait Tahfidz tidak dihasilkan.');
        if (sourceErrors.lesson || sourceErrors.periods) add('SOURCE_ERROR_LESSON', 'error', 'Data presensi jam pelajaran gagal dimuat karena kesalahan teknis. Temuan terkait jam pelajaran tidak dihasilkan.');
        if (sourceErrors.permission) add('SOURCE_ERROR_PERMISSION', 'warning', 'Data izin yang disetujui gagal dimuat; pengecualian izin tidak dipertimbangkan pada analisis.');

        if (!params.is_today_active) {
            add('HISTORICAL_ROSTER', 'warning',
                'Roster historis direkonstruksi dari transaksi presensi pada tanggal tersebut dan riwayat penempatan kelas satu-satunya pada tahun ajaran. Riwayat kelas tidak menyimpan tanggal efektif penempatan, sehingga roster mungkin tidak lengkap.');
            add('HOMEROOM_CURRENT', 'info', 'Nama wali kelas adalah wali kelas saat ini; riwayat wali kelas tidak tersedia untuk tanggal laporan.');
            add('SHIFT_CONFIG_HISTORY', 'info', 'Keterlambatan menggunakan data tersimpan pada transaksi. Pemeriksaan pulang lebih awal/presensi pulang hanya dilakukan apabila konfigurasi shift tidak berubah sejak tanggal laporan.');
        }
        if (c.roster.length === 0) {
            add('EMPTY_ROSTER', 'warning', 'Tidak ada siswa pada kelas ini untuk tanggal yang dipilih.');
        }
        add('TAHFIDZ_SCHEDULE_UNKNOWN', 'info', 'Jadwal dan kewajiban Tahfidz tidak tersedia pada sistem; temuan Tahfidz memakai bukti presensi kelas pada tanggal ini.');
        add('LESSON_SCHEDULE_UNKNOWN', 'info', 'Jadwal pelajaran kelas tidak tersedia; kolom jam mengikuti template jam pelajaran dan transaksi presensi. Jam tanpa transaksi tidak dianggap ALPA.');

        if (c.classWideEmpty && students.length) {
            add('CLASS_NO_ATTENDANCE_DATA', 'warning', 'Belum ada data presensi pada gerbang, Tahfidz, maupun jam pelajaran untuk kelas ini. Tidak dibuat temuan individual.');
        } else {
            if (sources.tahfidz && !c.tahfidzHasAnyRecord && students.length) {
                add('TAHFIDZ_CLASS_NOT_RECORDED', 'warning', 'Presensi Tahfidz kelas belum diinput. Tidak dibuat temuan individual untuk Tahfidz tidak tercatat.');
            }
            if (sources.gate && completeness.gate_records === 0 && students.length) {
                add('GATE_CLASS_NOT_RECORDED', 'warning', 'Belum ada presensi gerbang untuk seluruh siswa kelas ini.');
            }
            if (sources.gate && completeness.gate_entry_records > 0 && completeness.gate_exit_records === 0) {
                add('GATE_CLASS_CHECKOUT_NOT_RECORDED', 'warning', 'Belum ada presensi pulang gerbang untuk seluruh siswa kelas ini. Tidak dibuat temuan individual untuk presensi pulang tidak tercatat.');
            }
            if (sources.lesson) {
                const recorded = new Set(c.periods.filter(() => true).map((p) => p.period_number));
                const missing = c.periods.filter((p) => {
                    const hasAny = students.some((s) => {
                        const cell = s.lessons.find((l) => l.period_number === p.period_number);
                        return cell && !['NOT_RECORDED', 'UPCOMING', 'CANCELLED'].includes(cell.status);
                    });
                    const started = !params.is_today || p.start_min === null || p.start_min <= params.currentMin;
                    return started && !hasAny;
                });
                void recorded;
                if (missing.length) {
                    add('LESSON_PERIODS_NOT_RECORDED', 'warning', `Presensi ${missing.map((p) => p.label).join(', ')} belum tersedia.`);
                }
            }
        }
        if (c.missingDetail > 0) add('MISSING_STUDENT_DETAIL', 'warning', `Terdapat ${c.missingDetail} detail siswa yang belum tercatat pada transaksi presensi jam pelajaran.`);
        if (c.duplicateSessions > 0) add('DUPLICATE_LESSON_SESSION', 'warning', `Terdapat ${c.duplicateSessions} sesi presensi ganda pada jam yang sama; sesi dengan ID terkecil dipakai.`);
        if (c.gateDup > 0) add('DUPLICATE_GATE_RECORD', 'warning', `Terdapat ${c.gateDup} siswa dengan lebih dari satu record gerbang; record terbaru dipakai.`);
        if (c.tahfidzDup > 0) add('DUPLICATE_TAHFIDZ_RECORD', 'warning', `Terdapat ${c.tahfidzDup} siswa dengan lebih dari satu record Tahfidz; record terbaru dipakai.`);

        const noData = students.filter((s) => s.findings.some((f) => f.finding_code === 'ALL_ATTENDANCE_NOT_RECORDED'));
        if (noData.length) {
            add('STUDENTS_WITHOUT_ANY_DATA', 'warning',
                `${noData.length} siswa belum memiliki data presensi pada ketiga sumber: ${noData.map((s) => s.student_name).join(', ')}.`,
                { student_ids: noData.map((s) => s.student_id) });
        }
        return w;
    }
}

const service = new IntegratedDailyReportService();
module.exports = service;
module.exports.DISCLAIMER = DISCLAIMER;
module.exports.formatClock = formatClock;
