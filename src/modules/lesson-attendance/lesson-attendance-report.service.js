'use strict';

const db = require('../../models');
const { AcademicYear, Class, Grade, Department, Teacher, Subject, Student } = db;
const lessonAttendanceService = require('./lesson-attendance.service');
const { ERROR_CODES, AppError } = require('./lesson-attendance.constants');

function calcPercentage(hadir, terlambat, totalRecords) {
    const total = Number(totalRecords) || 0;
    if (total === 0) return null;
    return Number((((Number(hadir) + Number(terlambat)) / total) * 100).toFixed(2));
}

function emptyTotals() {
    return {
        sessions_count: 0,
        total_records: 0,
        hadir: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
        alpa: 0,
        attendance_percentage: null
    };
}

class LessonAttendanceReportService {
    async normalizeFilters(query = {}) {
        const { attendanceDate: today } = lessonAttendanceService.getServerDateTimeInTimezone();
        const monthStart = `${today.slice(0, 7)}-01`;

        const dateFrom = query.date_from || monthStart;
        const dateTo = query.date_to || today;
        if (dateFrom > dateTo) {
            throw new AppError('Tanggal mulai tidak boleh lebih besar dari tanggal selesai.', 422, ERROR_CODES.INVALID_DATE_RANGE);
        }

        let academicYearId = query.academic_year_id ? Number(query.academic_year_id) : null;
        let academicYear = null;
        if (academicYearId) {
            academicYear = await AcademicYear.findByPk(academicYearId, { attributes: ['id', 'name', 'start_date', 'end_date'] });
            if (!academicYear) {
                throw new AppError('Tahun ajaran tidak ditemukan.', 404, ERROR_CODES.INVALID_ACADEMIC_YEAR);
            }
        } else {
            academicYear = await AcademicYear.findOne({
                where: { is_active: true },
                attributes: ['id', 'name', 'start_date', 'end_date'],
                order: [['id', 'ASC']]
            });
            academicYearId = academicYear ? academicYear.id : null;
        }

        return {
            academic_year_id: academicYearId,
            academic_year_name: academicYear?.name || 'Semua Tahun Ajaran',
            date_from: dateFrom,
            date_to: dateTo,
            grade_id: query.grade_id ? Number(query.grade_id) : null,
            department_id: query.department_id ? Number(query.department_id) : null,
            class_id: query.class_id ? Number(query.class_id) : null,
            student_id: query.student_id ? Number(query.student_id) : null,
            teacher_id: query.teacher_id ? Number(query.teacher_id) : null,
            subject_id: query.subject_id ? Number(query.subject_id) : null,
            period_number: query.period_number ? Number(query.period_number) : null,
            input_method: query.input_method && ['QR', 'ADMIN'].includes(String(query.input_method).toUpperCase())
                ? String(query.input_method).toUpperCase()
                : null
        };
    }

    _buildWhereClause(filters) {
        // Always exclude cancelled sessions from valid attendance reports
        const where = ['s.cancelled_at IS NULL'];
        const replacements = {};

        if (filters.academic_year_id) {
            where.push('s.academic_year_id = :academic_year_id');
            replacements.academic_year_id = filters.academic_year_id;
        }
        if (filters.date_from) {
            where.push('s.attendance_date >= :date_from');
            replacements.date_from = filters.date_from;
        }
        if (filters.date_to) {
            where.push('s.attendance_date <= :date_to');
            replacements.date_to = filters.date_to;
        }
        if (filters.grade_id) {
            where.push('c.grade_id = :grade_id');
            replacements.grade_id = filters.grade_id;
        }
        if (filters.department_id) {
            where.push('c.department_id = :department_id');
            replacements.department_id = filters.department_id;
        }
        if (filters.class_id) {
            where.push('s.class_id = :class_id');
            replacements.class_id = filters.class_id;
        }
        if (filters.teacher_id) {
            where.push('s.teacher_id = :teacher_id');
            replacements.teacher_id = filters.teacher_id;
        }
        if (filters.subject_id) {
            where.push('s.subject_id = :subject_id');
            replacements.subject_id = filters.subject_id;
        }
        if (filters.period_number) {
            where.push('s.period_number = :period_number');
            replacements.period_number = filters.period_number;
        }
        if (filters.input_method) {
            where.push('s.input_method = :input_method');
            replacements.input_method = filters.input_method;
        }
        if (filters.student_id) {
            where.push('d.student_id = :student_id');
            replacements.student_id = filters.student_id;
        }

        return {
            whereSql: `WHERE ${where.join(' AND ')}`,
            replacements
        };
    }

    async getClassReport(query = {}) {
        const filters = await this.normalizeFilters(query);
        const { whereSql, replacements } = this._buildWhereClause(filters);

        const rows = await db.sequelize.query(
            `SELECT
                c.id AS class_id,
                c.name AS class_name,
                g.name AS grade_name,
                dpt.name AS department_name,
                COUNT(DISTINCT s.id) AS sessions_count,
                COUNT(d.id) AS total_records,
                COALESCE(SUM(CASE WHEN d.status = 'HADIR' THEN 1 ELSE 0 END), 0) AS hadir,
                COALESCE(SUM(CASE WHEN d.status = 'TERLAMBAT' THEN 1 ELSE 0 END), 0) AS terlambat,
                COALESCE(SUM(CASE WHEN d.status = 'IZIN' THEN 1 ELSE 0 END), 0) AS izin,
                COALESCE(SUM(CASE WHEN d.status = 'SAKIT' THEN 1 ELSE 0 END), 0) AS sakit,
                COALESCE(SUM(CASE WHEN d.status = 'ALPA' THEN 1 ELSE 0 END), 0) AS alpa
            FROM lesson_attendance_sessions s
            INNER JOIN classes c ON c.id = s.class_id
            LEFT JOIN grades g ON g.id = c.grade_id
            LEFT JOIN departments dpt ON dpt.id = c.department_id
            INNER JOIN lesson_attendance_details d ON d.session_id = s.id
            ${whereSql}
            GROUP BY c.id, c.name, g.name, g.level, dpt.name
            ORDER BY g.level ASC, c.name ASC, c.id ASC`,
            { replacements, type: db.Sequelize.QueryTypes.SELECT }
        );

        const grandTotal = emptyTotals();
        const mapped = rows.map((r) => {
            const sessionsCount = Number(r.sessions_count);
            const totalRecords = Number(r.total_records);
            const hadir = Number(r.hadir);
            const terlambat = Number(r.terlambat);
            const izin = Number(r.izin);
            const sakit = Number(r.sakit);
            const alpa = Number(r.alpa);

            grandTotal.sessions_count += sessionsCount;
            grandTotal.total_records += totalRecords;
            grandTotal.hadir += hadir;
            grandTotal.terlambat += terlambat;
            grandTotal.izin += izin;
            grandTotal.sakit += sakit;
            grandTotal.alpa += alpa;

            return {
                class_id: Number(r.class_id),
                class_name: r.class_name,
                grade_name: r.grade_name,
                department_name: r.department_name,
                sessions_count: sessionsCount,
                total_records: totalRecords,
                hadir,
                terlambat,
                izin,
                sakit,
                alpa,
                attendance_percentage: calcPercentage(hadir, terlambat, totalRecords)
            };
        });

        grandTotal.attendance_percentage = calcPercentage(
            grandTotal.hadir,
            grandTotal.terlambat,
            grandTotal.total_records
        );

        return { filters, rows: mapped, grand_total: grandTotal };
    }

    async getStudentReport(query = {}) {
        const filters = await this.normalizeFilters(query);
        const { whereSql, replacements } = this._buildWhereClause(filters);

        // Historical roster grouped by (student_id, session.class_id) so class transfers preserve historical class
        const rows = await db.sequelize.query(
            `SELECT
                st.id AS student_id,
                st.nis,
                st.full_name AS student_name,
                st.student_status,
                c.id AS class_id,
                c.name AS class_name,
                COUNT(DISTINCT s.id) AS total_periods,
                COALESCE(SUM(CASE WHEN d.status = 'HADIR' THEN 1 ELSE 0 END), 0) AS hadir,
                COALESCE(SUM(CASE WHEN d.status = 'TERLAMBAT' THEN 1 ELSE 0 END), 0) AS terlambat,
                COALESCE(SUM(CASE WHEN d.status = 'IZIN' THEN 1 ELSE 0 END), 0) AS izin,
                COALESCE(SUM(CASE WHEN d.status = 'SAKIT' THEN 1 ELSE 0 END), 0) AS sakit,
                COALESCE(SUM(CASE WHEN d.status = 'ALPA' THEN 1 ELSE 0 END), 0) AS alpa
            FROM lesson_attendance_details d
            INNER JOIN lesson_attendance_sessions s ON s.id = d.session_id
            INNER JOIN students st ON st.id = d.student_id
            INNER JOIN classes c ON c.id = s.class_id
            ${whereSql}
            GROUP BY st.id, st.nis, st.full_name, st.student_status, c.id, c.name
            ORDER BY c.name ASC, st.full_name ASC, st.id ASC`,
            { replacements, type: db.Sequelize.QueryTypes.SELECT }
        );

        const grandTotal = {
            total_periods: 0,
            hadir: 0,
            terlambat: 0,
            izin: 0,
            sakit: 0,
            alpa: 0,
            attendance_percentage: null
        };

        const mapped = rows.map((r) => {
            const totalPeriods = Number(r.total_periods);
            const hadir = Number(r.hadir);
            const terlambat = Number(r.terlambat);
            const izin = Number(r.izin);
            const sakit = Number(r.sakit);
            const alpa = Number(r.alpa);

            grandTotal.total_periods += totalPeriods;
            grandTotal.hadir += hadir;
            grandTotal.terlambat += terlambat;
            grandTotal.izin += izin;
            grandTotal.sakit += sakit;
            grandTotal.alpa += alpa;

            return {
                student_id: Number(r.student_id),
                nis: r.nis || null,
                student_name: r.student_name,
                student_status: r.student_status,
                class_id: Number(r.class_id),
                class_name: r.class_name,
                total_periods: totalPeriods,
                hadir,
                terlambat,
                izin,
                sakit,
                alpa,
                attendance_percentage: calcPercentage(hadir, terlambat, totalPeriods)
            };
        });

        grandTotal.attendance_percentage = calcPercentage(
            grandTotal.hadir,
            grandTotal.terlambat,
            grandTotal.total_periods
        );

        return { filters, rows: mapped, grand_total: grandTotal };
    }

    async getStudentReportDetail(studentId, query = {}) {
        const filters = await this.normalizeFilters({ ...query, student_id: studentId });
        const { whereSql, replacements } = this._buildWhereClause(filters);

        const student = await Student.findByPk(Number(studentId), {
            attributes: ['id', 'nis', 'full_name', 'student_status']
        });
        if (!student) {
            throw new AppError('Siswa tidak ditemukan.', 404, ERROR_CODES.INVALID_STUDENT_ROSTER);
        }

        const records = await db.sequelize.query(
            `SELECT
                d.id,
                s.id AS session_id,
                s.attendance_date,
                s.period_number,
                s.period_start_time,
                s.period_end_time,
                c.id AS class_id,
                c.name AS class_name,
                sub.name AS subject_name,
                t.full_name AS teacher_name,
                d.status,
                d.notes
            FROM lesson_attendance_details d
            INNER JOIN lesson_attendance_sessions s ON s.id = d.session_id
            INNER JOIN classes c ON c.id = s.class_id
            INNER JOIN subjects sub ON sub.id = s.subject_id
            INNER JOIN teachers t ON t.id = s.teacher_id
            ${whereSql}
            ORDER BY s.attendance_date DESC, s.period_number ASC, d.id DESC`,
            { replacements, type: db.Sequelize.QueryTypes.SELECT }
        );

        return {
            filters,
            student,
            records: records.map((r) => ({
                ...r,
                id: String(r.id),
                session_id: String(r.session_id)
            }))
        };
    }

    async getTeacherReport(query = {}) {
        const filters = await this.normalizeFilters(query);
        const { whereSql, replacements } = this._buildWhereClause(filters);

        const rows = await db.sequelize.query(
            `SELECT
                t.id AS teacher_id,
                t.full_name AS teacher_name,
                t.nip,
                COUNT(DISTINCT s.class_id) AS classes_count,
                COUNT(DISTINCT s.subject_id) AS subjects_count,
                COUNT(DISTINCT s.id) AS sessions_count,
                COUNT(DISTINCT CASE WHEN s.input_method = 'QR' THEN s.id END) AS qr_sessions,
                COUNT(DISTINCT CASE WHEN s.input_method = 'ADMIN' THEN s.id END) AS admin_sessions,
                COUNT(d.id) AS total_records,
                COALESCE(SUM(CASE WHEN d.status = 'HADIR' THEN 1 ELSE 0 END), 0) AS hadir,
                COALESCE(SUM(CASE WHEN d.status = 'TERLAMBAT' THEN 1 ELSE 0 END), 0) AS terlambat,
                COALESCE(SUM(CASE WHEN d.status = 'IZIN' THEN 1 ELSE 0 END), 0) AS izin,
                COALESCE(SUM(CASE WHEN d.status = 'SAKIT' THEN 1 ELSE 0 END), 0) AS sakit,
                COALESCE(SUM(CASE WHEN d.status = 'ALPA' THEN 1 ELSE 0 END), 0) AS alpa
            FROM lesson_attendance_sessions s
            INNER JOIN teachers t ON t.id = s.teacher_id
            INNER JOIN classes c ON c.id = s.class_id
            INNER JOIN lesson_attendance_details d ON d.session_id = s.id
            ${whereSql}
            GROUP BY t.id, t.full_name, t.nip
            ORDER BY sessions_count DESC, t.full_name ASC`,
            { replacements, type: db.Sequelize.QueryTypes.SELECT }
        );

        const grandTotal = {
            sessions_count: 0,
            qr_sessions: 0,
            admin_sessions: 0,
            total_records: 0,
            hadir: 0,
            terlambat: 0,
            izin: 0,
            sakit: 0,
            alpa: 0
        };

        const mapped = rows.map((r) => {
            const sessionsCount = Number(r.sessions_count);
            const qrSessions = Number(r.qr_sessions);
            const adminSessions = Number(r.admin_sessions);
            const totalRecords = Number(r.total_records);
            const hadir = Number(r.hadir);
            const terlambat = Number(r.terlambat);
            const izin = Number(r.izin);
            const sakit = Number(r.sakit);
            const alpa = Number(r.alpa);

            grandTotal.sessions_count += sessionsCount;
            grandTotal.qr_sessions += qrSessions;
            grandTotal.admin_sessions += adminSessions;
            grandTotal.total_records += totalRecords;
            grandTotal.hadir += hadir;
            grandTotal.terlambat += terlambat;
            grandTotal.izin += izin;
            grandTotal.sakit += sakit;
            grandTotal.alpa += alpa;

            return {
                teacher_id: Number(r.teacher_id),
                teacher_name: r.teacher_name,
                nip: r.nip || null,
                classes_count: Number(r.classes_count),
                subjects_count: Number(r.subjects_count),
                sessions_count: sessionsCount,
                qr_sessions: qrSessions,
                admin_sessions: adminSessions,
                total_records: totalRecords,
                hadir,
                terlambat,
                izin,
                sakit,
                alpa
            };
        });

        return { filters, rows: mapped, grand_total: grandTotal };
    }

    async getSubjectReport(query = {}) {
        const filters = await this.normalizeFilters(query);
        const { whereSql, replacements } = this._buildWhereClause(filters);

        const rows = await db.sequelize.query(
            `SELECT
                sub.id AS subject_id,
                sub.code AS subject_code,
                sub.name AS subject_name,
                COUNT(DISTINCT s.class_id) AS classes_count,
                COUNT(DISTINCT s.id) AS sessions_count,
                COUNT(d.id) AS total_records,
                COALESCE(SUM(CASE WHEN d.status = 'HADIR' THEN 1 ELSE 0 END), 0) AS hadir,
                COALESCE(SUM(CASE WHEN d.status = 'TERLAMBAT' THEN 1 ELSE 0 END), 0) AS terlambat,
                COALESCE(SUM(CASE WHEN d.status = 'IZIN' THEN 1 ELSE 0 END), 0) AS izin,
                COALESCE(SUM(CASE WHEN d.status = 'SAKIT' THEN 1 ELSE 0 END), 0) AS sakit,
                COALESCE(SUM(CASE WHEN d.status = 'ALPA' THEN 1 ELSE 0 END), 0) AS alpa
            FROM lesson_attendance_sessions s
            INNER JOIN subjects sub ON sub.id = s.subject_id
            INNER JOIN classes c ON c.id = s.class_id
            INNER JOIN lesson_attendance_details d ON d.session_id = s.id
            ${whereSql}
            GROUP BY sub.id, sub.code, sub.name
            ORDER BY sub.name ASC, sub.id ASC`,
            { replacements, type: db.Sequelize.QueryTypes.SELECT }
        );

        const grandTotal = emptyTotals();
        const mapped = rows.map((r) => {
            const sessionsCount = Number(r.sessions_count);
            const totalRecords = Number(r.total_records);
            const hadir = Number(r.hadir);
            const terlambat = Number(r.terlambat);
            const izin = Number(r.izin);
            const sakit = Number(r.sakit);
            const alpa = Number(r.alpa);

            grandTotal.sessions_count += sessionsCount;
            grandTotal.total_records += totalRecords;
            grandTotal.hadir += hadir;
            grandTotal.terlambat += terlambat;
            grandTotal.izin += izin;
            grandTotal.sakit += sakit;
            grandTotal.alpa += alpa;

            return {
                subject_id: Number(r.subject_id),
                subject_code: r.subject_code || null,
                subject_name: r.subject_name,
                classes_count: Number(r.classes_count),
                sessions_count: sessionsCount,
                total_records: totalRecords,
                hadir,
                terlambat,
                izin,
                sakit,
                alpa,
                attendance_percentage: calcPercentage(hadir, terlambat, totalRecords)
            };
        });

        grandTotal.attendance_percentage = calcPercentage(
            grandTotal.hadir,
            grandTotal.terlambat,
            grandTotal.total_records
        );

        return { filters, rows: mapped, grand_total: grandTotal };
    }

    async getDetailReport(query = {}, { paginate = true, maxLimit = 25000 } = {}) {
        const filters = await this.normalizeFilters(query);
        const { whereSql, replacements } = this._buildWhereClause(filters);

        const baseJoins = `
            FROM lesson_attendance_details d
            INNER JOIN lesson_attendance_sessions s ON s.id = d.session_id
            INNER JOIN classes c ON c.id = s.class_id
            INNER JOIN subjects sub ON sub.id = s.subject_id
            INNER JOIN teachers t ON t.id = s.teacher_id
            INNER JOIN students st ON st.id = d.student_id
        `;

        const [countRows] = await db.sequelize.query(
            `SELECT COUNT(*) AS total ${baseJoins} ${whereSql}`,
            { replacements }
        );
        const total = Number(countRows[0]?.total || 0);

        if (!paginate && total > maxLimit) {
            throw new AppError(
                `Jumlah data detail (${total.toLocaleString('id-ID')} baris) melebihi batas export (${maxLimit.toLocaleString('id-ID')} baris). Silakan persempit rentang tanggal atau filter terlebih dahulu.`,
                422,
                ERROR_CODES.REPORT_DATA_LIMIT_EXCEEDED
            );
        }

        const page = Math.max(Number(query.page) || 1, 1);
        const limit = paginate ? Math.min(Math.max(Number(query.limit) || 25, 1), 100) : total || 1;
        const offset = paginate ? (page - 1) * limit : 0;

        const rows = await db.sequelize.query(
            `SELECT
                d.id,
                s.id AS session_id,
                s.attendance_date,
                c.name AS class_name,
                s.period_number,
                s.period_start_time,
                s.period_end_time,
                sub.name AS subject_name,
                t.full_name AS teacher_name,
                s.input_method,
                st.nis,
                st.full_name AS student_name,
                d.status,
                d.notes
            ${baseJoins}
            ${whereSql}
            ORDER BY s.attendance_date ASC, c.name ASC, s.period_number ASC, st.full_name ASC, d.id ASC
            LIMIT :limit OFFSET :offset`,
            {
                replacements: { ...replacements, limit, offset },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        return {
            filters,
            rows: rows.map((r) => ({
                ...r,
                id: String(r.id),
                session_id: String(r.session_id),
                nis: r.nis || null,
                notes: r.notes || ''
            })),
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit) || 1
            }
        };
    }

    async describeActiveFilters(filters) {
        const parts = [];
        if (filters.grade_id) {
            const g = await Grade.findByPk(filters.grade_id, { attributes: ['name'] });
            if (g) parts.push(`Tingkat: ${g.name}`);
        }
        if (filters.department_id) {
            const d = await Department.findByPk(filters.department_id, { attributes: ['name'] });
            if (d) parts.push(`Jurusan: ${d.name}`);
        }
        if (filters.class_id) {
            const c = await Class.findByPk(filters.class_id, { attributes: ['name'] });
            if (c) parts.push(`Kelas: ${c.name}`);
        }
        if (filters.teacher_id) {
            const t = await Teacher.findByPk(filters.teacher_id, { attributes: ['full_name'] });
            if (t) parts.push(`Guru: ${t.full_name}`);
        }
        if (filters.subject_id) {
            const s = await Subject.findByPk(filters.subject_id, { attributes: ['name'] });
            if (s) parts.push(`Mapel: ${s.name}`);
        }
        if (filters.student_id) {
            const st = await Student.findByPk(filters.student_id, { attributes: ['full_name', 'nis'] });
            if (st) parts.push(`Siswa: ${st.full_name}${st.nis ? ` (${st.nis})` : ''}`);
        }
        if (filters.period_number) parts.push(`Jam ke-${filters.period_number}`);
        if (filters.input_method) parts.push(`Metode: ${filters.input_method}`);
        return parts.length > 0 ? parts.join(' | ') : 'Semua Data';
    }
}

module.exports = new LessonAttendanceReportService();
