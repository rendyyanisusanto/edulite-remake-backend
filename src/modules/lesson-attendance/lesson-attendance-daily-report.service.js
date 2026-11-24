'use strict';

const db = require('../../models');
const { AcademicYear, Class, Grade, Department } = db;
const lessonAttendanceService = require('./lesson-attendance.service');
const { analyzeStudentDailySequence } = require('./lesson-attendance-truancy.helper');
const { ERROR_CODES, AppError } = require('./lesson-attendance.constants');
const logger = require('../../core/logger');

const SORT_WHITELIST = new Set([
    'class_name',
    'student_name',
    'nis',
    'alpa_count',
    'truancy_count'
]);

const CONDITION_FILTERS = new Set([
    'ALL',
    'POTENTIAL_TRUANCY',
    'HAS_ALPA',
    'ABSENT_AT_START',
    'ALL_ABSENT',
    'INCOMPLETE',
    'ALL_PRESENT',
    'HAS_IZIN',
    'HAS_SAKIT',
    'HAS_TERLAMBAT'
]);

class LessonAttendanceDailyReportService {
    async _normalizeParams(query = {}) {
        const { attendanceDate: today, currentTime, timezone } = lessonAttendanceService.getServerDateTimeInTimezone();
        const attendanceDate = query.attendance_date || today;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
            throw new AppError('Format tanggal harus YYYY-MM-DD.', 422, ERROR_CODES.INVALID_ATTENDANCE_DATE);
        }
        if (attendanceDate > today) {
            throw new AppError('Tanggal laporan tidak boleh melebihi tanggal hari ini.', 422, ERROR_CODES.INVALID_ATTENDANCE_DATE);
        }

        let year = null;
        if (query.academic_year_id) {
            year = await AcademicYear.findByPk(Number(query.academic_year_id), {
                attributes: ['id', 'name', 'start_date', 'end_date', 'is_active']
            });
            if (!year) {
                throw new AppError('Tahun ajaran tidak ditemukan.', 404, ERROR_CODES.INVALID_ACADEMIC_YEAR);
            }
        } else {
            year = await AcademicYear.findOne({
                where: { is_active: true },
                attributes: ['id', 'name', 'start_date', 'end_date', 'is_active'],
                order: [['id', 'ASC']]
            });
            if (!year) {
                throw new AppError('Tahun ajaran aktif belum dikonfigurasi.', 409, ERROR_CODES.ACTIVE_ACADEMIC_YEAR_NOT_FOUND);
            }
        }

        if ((year.start_date && attendanceDate < year.start_date) || (year.end_date && attendanceDate > year.end_date)) {
            throw new AppError(
                'Tanggal laporan berada di luar rentang tahun ajaran yang dipilih.',
                422,
                ERROR_CODES.INVALID_ATTENDANCE_DATE
            );
        }

        const condition = String(query.attendance_condition || 'ALL').toUpperCase();
        const normalizedCondition = CONDITION_FILTERS.has(condition) ? condition : 'ALL';

        const sortBy = SORT_WHITELIST.has(query.sort_by) ? query.sort_by : 'class_name';
        const sortOrder = String(query.sort_order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        const prioritizeTruancy = query.prioritize_truancy === true || query.prioritize_truancy === 'true' || query.prioritize_truancy === '1';

        return {
            today,
            currentTime,
            timezone,
            attendance_date: attendanceDate,
            academic_year: {
                id: year.id,
                name: year.name,
                is_active: Boolean(year.is_active)
            },
            is_today_active: attendanceDate === today && Boolean(year.is_active),
            grade_id: query.grade_id ? Number(query.grade_id) : null,
            department_id: query.department_id ? Number(query.department_id) : null,
            class_id: query.class_id ? Number(query.class_id) : null,
            search: query.search ? String(query.search).trim() : '',
            attendance_condition: normalizedCondition,
            prioritize_truancy: prioritizeTruancy,
            sort_by: sortBy,
            sort_order: sortOrder,
            page: Math.max(Number(query.page) || 1, 1),
            limit: Math.min(Math.max(Number(query.limit) || 25, 1), 100)
        };
    }

    async buildDailyMatrix(query = {}, { paginate = true, maxExportRows = 15000 } = {}) {
        const params = await this._normalizeParams(query);

        try {
            // 1. Resolve roster rows (batch SQL, no N+1)
            const rosterReplacements = {
                academic_year_id: params.academic_year.id,
                attendance_date: params.attendance_date
            };
            const extraFilters = [];
            if (params.grade_id) {
                extraFilters.push('c.grade_id = :grade_id');
                rosterReplacements.grade_id = params.grade_id;
            }
            if (params.department_id) {
                extraFilters.push('c.department_id = :department_id');
                rosterReplacements.department_id = params.department_id;
            }
            if (params.class_id) {
                extraFilters.push('c.id = :class_id');
                rosterReplacements.class_id = params.class_id;
            }
            if (params.search) {
                extraFilters.push('(st.full_name LIKE :search OR st.nis LIKE :search)');
                rosterReplacements.search = `%${params.search}%`;
            }
            const extraWhere = extraFilters.length ? `AND ${extraFilters.join(' AND ')}` : '';

            let rosterRows = [];
            let historicalWarning = null;

            if (params.is_today_active) {
                const rosterSql = `
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
                    )
                    SELECT
                        st.id AS student_id,
                        st.nis,
                        st.full_name AS student_name,
                        st.student_status,
                        c.id AS class_id,
                        c.name AS class_name,
                        g.level AS grade_level
                    FROM ranked_class_history rch
                    INNER JOIN students st ON st.id = rch.student_id
                    INNER JOIN classes c ON c.id = rch.class_id
                    LEFT JOIN grades g ON g.id = c.grade_id
                    WHERE rch.row_num = 1
                      AND st.student_status = 'ACTIVE'
                      ${extraWhere}
                    ORDER BY g.level ASC, c.name ASC, st.full_name ASC, st.id ASC
                `;
                rosterRows = await db.sequelize.query(rosterSql, {
                    replacements: rosterReplacements,
                    type: db.Sequelize.QueryTypes.SELECT
                });
            } else {
                historicalWarning = 'Mode historis menampilkan siswa berdasarkan transaksi presensi yang tercatat pada tanggal tersebut karena riwayat kelas tidak menyimpan tanggal efektif perpindahan harian.';
                const histRosterSql = `
                    SELECT DISTINCT
                        st.id AS student_id,
                        st.nis,
                        st.full_name AS student_name,
                        st.student_status,
                        c.id AS class_id,
                        c.name AS class_name,
                        g.level AS grade_level
                    FROM lesson_attendance_details lad
                    INNER JOIN lesson_attendance_sessions s ON s.id = lad.session_id
                    INNER JOIN students st ON st.id = lad.student_id
                    INNER JOIN classes c ON c.id = s.class_id
                    LEFT JOIN grades g ON g.id = c.grade_id
                    WHERE s.academic_year_id = :academic_year_id
                      AND s.attendance_date = :attendance_date
                      AND s.cancelled_at IS NULL
                      ${extraWhere}
                    ORDER BY g.level ASC, c.name ASC, st.full_name ASC, st.id ASC
                `;
                rosterRows = await db.sequelize.query(histRosterSql, {
                    replacements: rosterReplacements,
                    type: db.Sequelize.QueryTypes.SELECT
                });
            }

            // Detect students appearing in multiple classes on the same historical date
            const studentClassCounts = new Map();
            for (const r of rosterRows) {
                studentClassCounts.set(r.student_id, (studentClassCounts.get(r.student_id) || 0) + 1);
            }

            const classIds = [...new Set(rosterRows.map((r) => Number(r.class_id)))];

            // 2. Batch fetch sessions (valid + cancelled) for the date & relevant classes
            let allSessions = [];
            if (classIds.length > 0 || params.class_id) {
                const targetClassIds = classIds.length > 0 ? classIds : [params.class_id];
                allSessions = await db.sequelize.query(
                    `SELECT
                        s.id,
                        s.class_id,
                        s.teacher_id,
                        t.full_name AS teacher_name,
                        s.subject_id,
                        sub.name AS subject_name,
                        s.lesson_period_id,
                        s.period_number,
                        s.period_start_time,
                        s.period_end_time,
                        s.input_method,
                        s.cancelled_at,
                        s.created_at
                    FROM lesson_attendance_sessions s
                    INNER JOIN teachers t ON t.id = s.teacher_id
                    INNER JOIN subjects sub ON sub.id = s.subject_id
                    WHERE s.academic_year_id = :academic_year_id
                      AND s.attendance_date = :attendance_date
                      AND s.class_id IN (:classIds)
                    ORDER BY s.period_number ASC`,
                    {
                        replacements: {
                            academic_year_id: params.academic_year.id,
                            attendance_date: params.attendance_date,
                            classIds: targetClassIds
                        },
                        type: db.Sequelize.QueryTypes.SELECT
                    }
                );
            }

            const validSessions = allSessions.filter((s) => !s.cancelled_at);
            const cancelledSessions = allSessions.filter((s) => Boolean(s.cancelled_at));
            const validSessionIds = validSessions.map((s) => s.id);

            // 3. Batch fetch all details for valid sessions in ONE query
            const detailMap = new Map(); // `${session_id}:${student_id}` -> detail
            if (validSessionIds.length > 0) {
                const details = await db.sequelize.query(
                    `SELECT id, session_id, student_id, status, notes
                     FROM lesson_attendance_details
                     WHERE session_id IN (:sessionIds)`,
                    {
                        replacements: { sessionIds: validSessionIds },
                        type: db.Sequelize.QueryTypes.SELECT
                    }
                );
                for (const d of details) {
                    detailMap.set(`${d.session_id}:${d.student_id}`, d);
                }
            }

            // 4. Resolve dynamic lesson period columns
            let templatePeriods = [];
            try {
                const periodInfo = await lessonAttendanceService.getAvailableLessonPeriods(params.currentTime);
                templatePeriods = periodInfo.periods.map((p) => (p.get ? p.get({ plain: true }) : p));
            } catch (err) {
                if (err.errorCode !== ERROR_CODES.LESSON_PERIOD_TEMPLATE_NOT_FOUND) throw err;
            }

            const periodColMap = new Map();
            if (params.is_today_active) {
                for (const p of templatePeriods) {
                    periodColMap.set(Number(p.period_number), {
                        period_number: Number(p.period_number),
                        period_order: Number(p.period_order),
                        label: `J${p.period_number}`,
                        name: p.name,
                        start_time: String(p.start_time).slice(0, 5),
                        end_time: String(p.end_time).slice(0, 5),
                        raw_start_time: p.start_time,
                        from_template: true,
                        subject_name: null
                    });
                }
            }
            for (const s of validSessions) {
                const pn = Number(s.period_number);
                if (!periodColMap.has(pn)) {
                    periodColMap.set(pn, {
                        period_number: pn,
                        period_order: pn,
                        label: `J${pn}`,
                        name: `Jam ke-${pn}`,
                        start_time: String(s.period_start_time).slice(0, 5),
                        end_time: String(s.period_end_time).slice(0, 5),
                        raw_start_time: s.period_start_time,
                        from_template: false,
                        subject_name: null
                    });
                }
            }

            const periods = Array.from(periodColMap.values()).sort(
                (a, b) => a.period_order - b.period_order || a.period_number - b.period_number
            );

            // Attach subject_name to header only when a single class is filtered
            const validSessionByClassPeriod = new Map();
            for (const s of validSessions) {
                validSessionByClassPeriod.set(`${s.class_id}:${s.period_number}`, s);
                if (params.class_id && Number(s.class_id) === params.class_id) {
                    const col = periodColMap.get(Number(s.period_number));
                    if (col) col.subject_name = s.subject_name;
                }
            }

            const cancelledByClassPeriod = new Map();
            for (const s of cancelledSessions) {
                cancelledByClassPeriod.set(`${s.class_id}:${s.period_number}`, s);
            }

            // 5. Build matrix rows & run shared truancy detection
            const baseSummary = {
                total_students: rosterRows.length,
                potential_truancy_count: 0,
                has_alpa_count: 0,
                all_absent_count: 0,
                incomplete_count: 0,
                recorded_periods: params.class_id
                    ? validSessions.filter((s) => Number(s.class_id) === params.class_id).length
                    : validSessions.length,
                total_applicable_periods: params.class_id
                    ? periods.length
                    : periods.length * classIds.length
            };

            const analyzedRows = rosterRows.map((r) => {
                const attendanceCells = periods.map((p) => {
                    const key = `${r.class_id}:${p.period_number}`;
                    const validSess = validSessionByClassPeriod.get(key);
                    const cancelledSess = cancelledByClassPeriod.get(key);

                    if (validSess) {
                        const detail = detailMap.get(`${validSess.id}:${r.student_id}`);
                        if (detail) {
                            return {
                                period_number: p.period_number,
                                session_id: String(validSess.id),
                                status: detail.status,
                                notes: detail.notes || '',
                                teacher_name: validSess.teacher_name,
                                subject_name: validSess.subject_name,
                                input_method: validSess.input_method,
                                submitted_at: validSess.created_at,
                                period_start_time: String(validSess.period_start_time).slice(0, 5),
                                period_end_time: String(validSess.period_end_time).slice(0, 5)
                            };
                        }
                        return {
                            period_number: p.period_number,
                            session_id: String(validSess.id),
                            status: 'MISSING_DETAIL',
                            notes: '',
                            teacher_name: validSess.teacher_name,
                            subject_name: validSess.subject_name,
                            input_method: validSess.input_method,
                            submitted_at: validSess.created_at,
                            period_start_time: String(validSess.period_start_time).slice(0, 5),
                            period_end_time: String(validSess.period_end_time).slice(0, 5)
                        };
                    }

                    if (cancelledSess) {
                        return {
                            period_number: p.period_number,
                            session_id: String(cancelledSess.id),
                            status: 'CANCELLED',
                            period_start_time: p.start_time,
                            period_end_time: p.end_time
                        };
                    }

                    if (params.is_today_active && p.raw_start_time && p.raw_start_time > params.currentTime) {
                        return {
                            period_number: p.period_number,
                            session_id: null,
                            status: 'UPCOMING',
                            period_start_time: p.start_time,
                            period_end_time: p.end_time
                        };
                    }

                    return {
                        period_number: p.period_number,
                        session_id: null,
                        status: 'NOT_RECORDED',
                        period_start_time: p.start_time,
                        period_end_time: p.end_time
                    };
                });

                const analysis = analyzeStudentDailySequence(attendanceCells);

                if (analysis.potential_truancy) baseSummary.potential_truancy_count += 1;
                if (analysis.summary.alpa > 0) baseSummary.has_alpa_count += 1;
                if (analysis.all_recorded_periods_absent) baseSummary.all_absent_count += 1;
                if (analysis.incomplete_attendance) baseSummary.incomplete_count += 1;

                return {
                    student_id: Number(r.student_id),
                    nis: r.nis || null,
                    student_name: r.student_name,
                    student_status: r.student_status,
                    class_id: Number(r.class_id),
                    class_name: r.class_name,
                    multi_class_on_date: (studentClassCounts.get(r.student_id) || 0) > 1,
                    attendance: attendanceCells,
                    ...analysis
                };
            });

            // 6. Apply quick condition filter across ALL analyzed rows
            const filteredRows = analyzedRows.filter((row) => {
                const cond = params.attendance_condition;
                if (cond === 'ALL') return true;
                if (cond === 'POTENTIAL_TRUANCY') return row.potential_truancy;
                if (cond === 'HAS_ALPA') return row.summary.alpa > 0;
                if (cond === 'ABSENT_AT_START') return row.absent_at_start;
                if (cond === 'ALL_ABSENT') return row.all_recorded_periods_absent;
                if (cond === 'INCOMPLETE') return row.incomplete_attendance;
                if (cond === 'ALL_PRESENT') {
                    return row.summary.recorded_periods > 0 &&
                        (row.summary.hadir + row.summary.terlambat) === row.summary.recorded_periods;
                }
                if (cond === 'HAS_IZIN') return row.summary.izin > 0;
                if (cond === 'HAS_SAKIT') return row.summary.sakit > 0;
                if (cond === 'HAS_TERLAMBAT') return row.summary.terlambat > 0;
                return true;
            });

            // 7. Compute per-period column totals across ALL filtered rows
            const columnTotals = {};
            for (const p of periods) {
                columnTotals[p.period_number] = { H: 0, T: 0, I: 0, S: 0, A: 0 };
            }
            for (const row of filteredRows) {
                for (const cell of row.attendance) {
                    const tot = columnTotals[cell.period_number];
                    if (!tot) continue;
                    if (cell.status === 'HADIR') tot.H += 1;
                    else if (cell.status === 'TERLAMBAT') tot.T += 1;
                    else if (cell.status === 'IZIN') tot.I += 1;
                    else if (cell.status === 'SAKIT') tot.S += 1;
                    else if (cell.status === 'ALPA') tot.A += 1;
                }
            }

            // 8. Sort BEFORE pagination
            const dir = params.sort_order === 'DESC' ? -1 : 1;
            filteredRows.sort((a, b) => {
                if (params.prioritize_truancy) {
                    if (a.potential_truancy !== b.potential_truancy) {
                        return a.potential_truancy ? -1 : 1;
                    }
                    if (a.potential_truancy_periods.length !== b.potential_truancy_periods.length) {
                        return b.potential_truancy_periods.length - a.potential_truancy_periods.length;
                    }
                }

                let cmp = 0;
                if (params.sort_by === 'student_name') {
                    cmp = a.student_name.localeCompare(b.student_name, 'id') * dir;
                } else if (params.sort_by === 'nis') {
                    cmp = String(a.nis || '').localeCompare(String(b.nis || ''), 'id') * dir;
                } else if (params.sort_by === 'alpa_count') {
                    cmp = (a.summary.alpa - b.summary.alpa) * dir;
                } else if (params.sort_by === 'truancy_count') {
                    cmp = (a.potential_truancy_periods.length - b.potential_truancy_periods.length) * dir;
                } else {
                    cmp = a.class_name.localeCompare(b.class_name, 'id') * dir;
                }

                if (cmp !== 0) return cmp;
                const clsCmp = a.class_name.localeCompare(b.class_name, 'id');
                if (clsCmp !== 0) return clsCmp;
                const nameCmp = a.student_name.localeCompare(b.student_name, 'id');
                if (nameCmp !== 0) return nameCmp;
                return a.student_id - b.student_id;
            });

            if (!paginate && filteredRows.length > maxExportRows) {
                throw new AppError(
                    `Jumlah data (${filteredRows.length.toLocaleString('id-ID')} siswa) melebihi batas export (${maxExportRows.toLocaleString('id-ID')} siswa). Silakan persempit filter kelas atau kondisi.`,
                    422,
                    ERROR_CODES.REPORT_DATA_LIMIT_EXCEEDED
                );
            }

            const total = filteredRows.length;
            const totalPages = Math.ceil(total / params.limit) || 1;
            const safePage = Math.min(params.page, totalPages);
            const offset = (safePage - 1) * params.limit;
            const pagedStudents = paginate ? filteredRows.slice(offset, offset + params.limit) : filteredRows;

            return {
                attendance_date: params.attendance_date,
                is_today: params.attendance_date === params.today,
                is_historical_mode: !params.is_today_active,
                historical_warning: historicalWarning,
                academic_year: params.academic_year,
                periods: periods.map(({ raw_start_time, ...rest }) => rest),
                students: pagedStudents,
                base_summary: baseSummary,
                filtered_count: total,
                column_totals: columnTotals,
                pagination: {
                    page: safePage,
                    limit: params.limit,
                    total,
                    total_pages: totalPages
                },
                applied_filters: {
                    academic_year_id: params.academic_year.id,
                    attendance_date: params.attendance_date,
                    grade_id: params.grade_id,
                    department_id: params.department_id,
                    class_id: params.class_id,
                    search: params.search,
                    attendance_condition: params.attendance_condition,
                    prioritize_truancy: params.prioritize_truancy
                }
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Failed to generate daily student attendance matrix', {
                module: 'lesson-attendance',
                feature: 'daily-student-report',
                operation: 'buildDailyMatrix',
                attendance_date: params.attendance_date,
                academic_year_id: params.academic_year?.id,
                class_id: params.class_id,
                error_code: ERROR_CODES.DAILY_REPORT_QUERY_FAILED,
                error_message: error.message,
                stack: error.stack
            });
            throw new AppError(
                'Gagal memuat laporan harian presensi siswa.',
                500,
                ERROR_CODES.DAILY_REPORT_QUERY_FAILED
            );
        }
    }

    async describeFilters(applied) {
        const parts = [];
        if (applied.grade_id) {
            const g = await Grade.findByPk(applied.grade_id, { attributes: ['name'] });
            if (g) parts.push(`Tingkat: ${g.name}`);
        }
        if (applied.department_id) {
            const d = await Department.findByPk(applied.department_id, { attributes: ['name'] });
            if (d) parts.push(`Jurusan: ${d.name}`);
        }
        if (applied.class_id) {
            const c = await Class.findByPk(applied.class_id, { attributes: ['name'] });
            if (c) parts.push(`Kelas: ${c.name}`);
        }
        if (applied.attendance_condition && applied.attendance_condition !== 'ALL') {
            parts.push(`Kondisi: ${applied.attendance_condition}`);
        }
        if (applied.search) {
            parts.push(`Cari: "${applied.search}"`);
        }
        return parts.length > 0 ? parts.join(' | ') : 'Semua Siswa';
    }
}

module.exports = new LessonAttendanceDailyReportService();
