'use strict';

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Op, fn, col, literal, where } = require('sequelize');
const {
    sequelize,
    SchoolProfile,
    Student,
    Class,
    StudentClassHistory,
    Extracurricular,
    ExtracurricularMember,
    ExtracurricularSession,
    ExtracurricularStudentAttendance,
    ExtracurricularCoach,
    ExtracurricularCoachAssignment,
    ExtracurricularProgressAspect,
    ExtracurricularStudentProgress
} = require('../../models');

class ExtracurricularReportService {
    _pagination(query = {}) {
        const page = Math.max(1, parseInt(query.page, 10) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 20));
        const offset = (page - 1) * limit;
        return { page, limit, offset };
    }

    _meta(totalItems, page, limit) {
        return { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page };
    }

    _paginateArray(items, page, limit) {
        const start = (page - 1) * limit;
        const end = start + limit;
        return {
            items: items.slice(start, end),
            ...this._meta(items.length, page, limit)
        };
    }

    _normalizeFilters(query = {}) {
        return {
            academic_year_id: query.academic_year_id ? parseInt(query.academic_year_id, 10) : null,
            extracurricular_id: query.extracurricular_id ? parseInt(query.extracurricular_id, 10) : null,
            class_id: query.class_id ? parseInt(query.class_id, 10) : null,
            coach_id: query.coach_id ? parseInt(query.coach_id, 10) : null,
            start_date: query.start_date || query.date_from || null,
            end_date: query.end_date || query.date_to || null,
            search: (query.search || query.keyword || '').trim()
        };
    }

    _dateRangeWhere(fieldName, filters) {
        if (!filters.start_date && !filters.end_date) return {};
        const clause = {};
        if (filters.start_date) clause[Op.gte] = filters.start_date;
        if (filters.end_date) clause[Op.lte] = filters.end_date;
        return { [fieldName]: clause };
    }

    async getMembersReport(query = {}) {
        const filters = this._normalizeFilters(query);
        const { page, limit, offset } = this._pagination(query);

        const whereMember = {};
        if (filters.academic_year_id) whereMember.academic_year_id = filters.academic_year_id;
        if (filters.extracurricular_id) whereMember.extracurricular_id = filters.extracurricular_id;
        Object.assign(whereMember, this._dateRangeWhere('join_date', filters));

        const classHistoryInclude = {
            model: StudentClassHistory,
            as: 'class_history',
            required: !!filters.class_id,
            attributes: ['id', 'class_id', 'academic_year_id'],
            include: [{ model: Class, as: 'class_info', attributes: ['id', 'name'], required: false }]
        };
        if (filters.academic_year_id) classHistoryInclude.where = { academic_year_id: filters.academic_year_id };
        if (filters.class_id) classHistoryInclude.where = { ...(classHistoryInclude.where || {}), class_id: filters.class_id };

        const searchWhere = [];
        if (filters.search) {
            searchWhere.push(
                { '$student.full_name$': { [Op.like]: `%${filters.search}%` } },
                { '$student.nis$': { [Op.like]: `%${filters.search}%` } },
                { '$extracurricular.name$': { [Op.like]: `%${filters.search}%` } }
            );
        }

        const { count, rows } = await ExtracurricularMember.findAndCountAll({
            where: {
                ...whereMember,
                ...(searchWhere.length ? { [Op.or]: searchWhere } : {})
            },
            include: [
                { model: Extracurricular, as: 'extracurricular', attributes: ['id', 'name', 'code'] },
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'full_name', 'nis'],
                    include: [classHistoryInclude]
                }
            ],
            order: [['join_date', 'DESC'], ['id', 'DESC']],
            distinct: true,
            limit,
            offset,
            subQuery: false
        });

        const items = rows.map((row) => {
            const history = (row.student?.class_history || [])[0];
            return {
                id: row.id,
                extracurricular_name: row.extracurricular?.name || '-',
                student_name: row.student?.full_name || '-',
                class_name: history?.class_info?.name || '-',
                join_date: row.join_date,
                status: row.status
            };
        });

        return { items, ...this._meta(count, page, limit), filters };
    }

    async _buildStudentAttendanceAgg(query = {}) {
        const filters = this._normalizeFilters(query);
        const whereSession = {};
        if (filters.academic_year_id) whereSession.academic_year_id = filters.academic_year_id;
        if (filters.extracurricular_id) whereSession.extracurricular_id = filters.extracurricular_id;
        Object.assign(whereSession, this._dateRangeWhere('session_date', filters));

        let classStudentIds = null;
        if (filters.class_id) {
            const classRows = await StudentClassHistory.findAll({
                where: {
                    class_id: filters.class_id,
                    ...(filters.academic_year_id ? { academic_year_id: filters.academic_year_id } : {})
                },
                attributes: ['student_id']
            });
            classStudentIds = [...new Set(classRows.map((item) => item.student_id))];
            if (classStudentIds.length === 0) return [];
        }

        const studentInclude = {
            model: Student,
            as: 'student',
            attributes: ['id', 'full_name', 'nis']
        };

        const rows = await ExtracurricularStudentAttendance.findAll({
            attributes: [
                'student_id',
                [col('session.extracurricular_id'), 'extracurricular_id'],
                [fn('COUNT', col('ExtracurricularStudentAttendance.id')), 'total_records'],
                [fn('SUM', literal("CASE WHEN ExtracurricularStudentAttendance.attendance_status = 'PRESENT' THEN 1 ELSE 0 END")), 'total_present'],
                [fn('SUM', literal("CASE WHEN ExtracurricularStudentAttendance.attendance_status = 'ABSENT' THEN 1 ELSE 0 END")), 'total_absent'],
                [fn('SUM', literal("CASE WHEN ExtracurricularStudentAttendance.attendance_status = 'SICK' THEN 1 ELSE 0 END")), 'total_sick'],
                [fn('SUM', literal("CASE WHEN ExtracurricularStudentAttendance.attendance_status = 'PERMIT' THEN 1 ELSE 0 END")), 'total_permit']
            ],
            include: [
                {
                    model: ExtracurricularSession,
                    as: 'session',
                    attributes: ['id', 'session_date', 'extracurricular_id'],
                    where: whereSession,
                    required: true,
                    include: [{ model: Extracurricular, as: 'extracurricular', attributes: ['id', 'name'], required: true }]
                },
                studentInclude
            ],
            where: {
                ...(classStudentIds ? { student_id: { [Op.in]: classStudentIds } } : {}),
                ...(filters.search
                    ? {
                        [Op.or]: [
                            where(col('student.full_name'), { [Op.like]: `%${filters.search}%` }),
                            where(col('student.nis'), { [Op.like]: `%${filters.search}%` }),
                            where(col('session.extracurricular.name'), { [Op.like]: `%${filters.search}%` })
                        ]
                    }
                    : {})
            },
            group: ['ExtracurricularStudentAttendance.student_id', 'session.extracurricular_id', 'student.id', 'session->extracurricular.id'],
            order: [[col('student.full_name'), 'ASC']]
        });

        return rows.map((row) => {
            const data = row.toJSON();
            const totalRecords = Number(data.total_records || 0);
            const totalPresent = Number(data.total_present || 0);
            const totalAbsent = Number(data.total_absent || 0);
            const totalSick = Number(data.total_sick || 0);
            const totalPermit = Number(data.total_permit || 0);
            const attendancePercentage = totalRecords ? ((totalPresent / totalRecords) * 100) : 0;
            return {
                student_id: data.student_id,
                student_name: data.student?.full_name || '-',
                extracurricular_id: data.extracurricular_id,
                extracurricular_name: data.session?.extracurricular?.name || '-',
                total_present: totalPresent,
                total_absent: totalAbsent,
                total_sick: totalSick,
                total_permit: totalPermit,
                attendance_percentage: Number(attendancePercentage.toFixed(2))
            };
        });
    }

    async getStudentAttendanceReport(query = {}) {
        const filters = this._normalizeFilters(query);
        const { page, limit } = this._pagination(query);
        const items = await this._buildStudentAttendanceAgg(query);
        return { ...this._paginateArray(items, page, limit), filters };
    }

    async getCoachAttendanceReport(query = {}) {
        const filters = this._normalizeFilters(query);
        const { page, limit } = this._pagination(query);

        const whereSession = {};
        if (filters.academic_year_id) whereSession.academic_year_id = filters.academic_year_id;
        if (filters.extracurricular_id) whereSession.extracurricular_id = filters.extracurricular_id;
        Object.assign(whereSession, this._dateRangeWhere('session_date', filters));

        const assignmentWhere = {};
        if (filters.coach_id) assignmentWhere.coach_id = filters.coach_id;

        const rows = await ExtracurricularSession.findAll({
            attributes: [
                [col('coach_assignment.coach_id'), 'coach_id'],
                'extracurricular_id',
                [fn('COUNT', col('ExtracurricularSession.id')), 'total_sessions'],
                [fn('SUM', literal("CASE WHEN ExtracurricularSession.coach_attendance_status = 'PRESENT' THEN 1 ELSE 0 END")), 'total_present'],
                [fn('SUM', literal("CASE WHEN ExtracurricularSession.coach_attendance_status = 'LATE' THEN 1 ELSE 0 END")), 'total_late'],
                [fn('SUM', literal("CASE WHEN ExtracurricularSession.coach_attendance_status = 'ABSENT' THEN 1 ELSE 0 END")), 'total_absent']
            ],
            where: whereSession,
            include: [
                { model: Extracurricular, as: 'extracurricular', attributes: ['id', 'name'], required: true },
                {
                    model: ExtracurricularCoachAssignment,
                    as: 'coach_assignment',
                    attributes: ['id', 'coach_id'],
                    where: assignmentWhere,
                    required: true,
                    include: [{ model: ExtracurricularCoach, as: 'coach', attributes: ['id', 'full_name'], required: true }]
                }
            ],
            group: ['coach_assignment.coach_id', 'ExtracurricularSession.extracurricular_id', 'extracurricular.id', 'coach_assignment.id', 'coach_assignment->coach.id'],
            order: [[col('coach_assignment.coach.full_name'), 'ASC']]
        });

        const mapped = rows
            .map((row) => {
                const data = row.toJSON();
                return {
                    coach_name: data.coach_assignment?.coach?.full_name || '-',
                    extracurricular_name: data.extracurricular?.name || '-',
                    total_sessions: Number(data.total_sessions || 0),
                    total_present: Number(data.total_present || 0),
                    total_late: Number(data.total_late || 0),
                    total_absent: Number(data.total_absent || 0)
                };
            })
            .filter((item) => !filters.search || item.coach_name.toLowerCase().includes(filters.search.toLowerCase()) || item.extracurricular_name.toLowerCase().includes(filters.search.toLowerCase()));

        return { ...this._paginateArray(mapped, page, limit), filters };
    }

    async getStudentProgressReport(query = {}) {
        const filters = this._normalizeFilters(query);
        const { page, limit, offset } = this._pagination(query);

        const whereProgress = {};
        if (filters.academic_year_id) whereProgress.academic_year_id = filters.academic_year_id;
        if (filters.extracurricular_id) whereProgress.extracurricular_id = filters.extracurricular_id;
        Object.assign(whereProgress, this._dateRangeWhere('progress_date', filters));

        const { count, rows } = await ExtracurricularStudentProgress.findAndCountAll({
            where: {
                ...whereProgress,
                ...(filters.search
                    ? {
                        [Op.or]: [
                            { '$student.full_name$': { [Op.like]: `%${filters.search}%` } },
                            { '$aspect.name$': { [Op.like]: `%${filters.search}%` } },
                            { '$extracurricular.name$': { [Op.like]: `%${filters.search}%` } }
                        ]
                    }
                    : {})
            },
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'full_name', 'nis'],
                    include: [
                        {
                            model: StudentClassHistory,
                            as: 'class_history',
                            required: !!filters.class_id,
                            attributes: ['id', 'class_id', 'academic_year_id'],
                            where: {
                                ...(filters.class_id ? { class_id: filters.class_id } : {}),
                                ...(filters.academic_year_id ? { academic_year_id: filters.academic_year_id } : {})
                            },
                            include: [{ model: Class, as: 'class_info', attributes: ['id', 'name'], required: false }]
                        }
                    ]
                },
                { model: Extracurricular, as: 'extracurricular', attributes: ['id', 'name'] },
                { model: ExtracurricularProgressAspect, as: 'aspect', attributes: ['id', 'name'], required: false }
            ],
            distinct: true,
            limit,
            offset,
            order: [['progress_date', 'DESC'], ['id', 'DESC']],
            subQuery: false
        });

        const items = rows.map((row) => ({
            id: row.id,
            student_name: row.student?.full_name || '-',
            extracurricular_name: row.extracurricular?.name || '-',
            aspect_name: row.aspect?.name || '-',
            score: row.score,
            predicate: row.predicate || '-',
            note: row.note || '-'
        }));

        return { items, ...this._meta(count, page, limit), filters };
    }

    async getSessionsReport(query = {}) {
        const filters = this._normalizeFilters(query);
        const { page, limit, offset } = this._pagination(query);

        const whereSession = {};
        if (filters.academic_year_id) whereSession.academic_year_id = filters.academic_year_id;
        if (filters.extracurricular_id) whereSession.extracurricular_id = filters.extracurricular_id;
        Object.assign(whereSession, this._dateRangeWhere('session_date', filters));

        const assignmentWhere = {};
        if (filters.coach_id) assignmentWhere.coach_id = filters.coach_id;

        const { count, rows } = await ExtracurricularSession.findAndCountAll({
            where: {
                ...whereSession,
                ...(filters.search
                    ? {
                        [Op.or]: [
                            { '$extracurricular.name$': { [Op.like]: `%${filters.search}%` } },
                            { '$coach_assignment.coach.full_name$': { [Op.like]: `%${filters.search}%` } },
                            { session_title: { [Op.like]: `%${filters.search}%` } }
                        ]
                    }
                    : {})
            },
            include: [
                { model: Extracurricular, as: 'extracurricular', attributes: ['id', 'name'] },
                {
                    model: ExtracurricularCoachAssignment,
                    as: 'coach_assignment',
                    attributes: ['id', 'coach_id'],
                    required: false,
                    where: assignmentWhere,
                    include: [{ model: ExtracurricularCoach, as: 'coach', attributes: ['id', 'full_name'], required: false }]
                }
            ],
            order: [['session_date', 'DESC'], ['start_time', 'ASC']],
            distinct: true,
            limit,
            offset,
            subQuery: false
        });

        const items = await Promise.all(rows.map(async (row) => {
            const [totalStudents, totalPresent] = await Promise.all([
                ExtracurricularMember.count({
                    where: {
                        extracurricular_id: row.extracurricular_id,
                        academic_year_id: row.academic_year_id,
                        status: 'ACTIVE'
                    }
                }),
                ExtracurricularStudentAttendance.count({
                    where: { session_id: row.id, attendance_status: 'PRESENT' }
                })
            ]);

            return {
                id: row.id,
                session_date: row.session_date,
                extracurricular_name: row.extracurricular?.name || '-',
                coach_name: row.coach_assignment?.coach?.full_name || '-',
                total_students: totalStudents,
                total_present: totalPresent,
                material: row.material || '-',
                notes: row.notes || '-'
            };
        }));

        return { items, ...this._meta(count, page, limit), filters };
    }

    async getRankingReport(query = {}) {
        const filters = this._normalizeFilters(query);
        const { page, limit } = this._pagination(query);
        const items = await this._buildStudentAttendanceAgg(query);

        const groupedByExtracurricular = new Map();
        for (const item of items) {
            const key = item.extracurricular_id;
            if (!groupedByExtracurricular.has(key)) groupedByExtracurricular.set(key, []);
            groupedByExtracurricular.get(key).push(item);
        }

        const rankedItems = [];
        for (const [, list] of groupedByExtracurricular) {
            list.sort((a, b) => b.attendance_percentage - a.attendance_percentage || a.student_name.localeCompare(b.student_name));
            list.forEach((entry, idx) => {
                rankedItems.push({
                    student_name: entry.student_name,
                    extracurricular_name: entry.extracurricular_name,
                    attendance_percentage: entry.attendance_percentage,
                    ranking_position: idx + 1
                });
            });
        }

        rankedItems.sort((a, b) => a.extracurricular_name.localeCompare(b.extracurricular_name) || a.ranking_position - b.ranking_position);
        return { ...this._paginateArray(rankedItems, page, limit), filters };
    }

    async getDashboardReport(query = {}) {
        const filters = this._normalizeFilters(query);
        const whereSession = {};
        if (filters.academic_year_id) whereSession.academic_year_id = filters.academic_year_id;
        if (filters.extracurricular_id) whereSession.extracurricular_id = filters.extracurricular_id;
        Object.assign(whereSession, this._dateRangeWhere('session_date', filters));

        const whereMember = {};
        if (filters.academic_year_id) whereMember.academic_year_id = filters.academic_year_id;
        if (filters.extracurricular_id) whereMember.extracurricular_id = filters.extracurricular_id;
        if (filters.start_date || filters.end_date) Object.assign(whereMember, this._dateRangeWhere('join_date', filters));

        const [totalExtracurricular, totalMembers, totalSessions] = await Promise.all([
            Extracurricular.count({ where: { is_active: true } }),
            ExtracurricularMember.count({ where: whereMember }),
            ExtracurricularSession.count({ where: whereSession })
        ]);

        const popular = await ExtracurricularMember.findAll({
            attributes: [
                'extracurricular_id',
                [fn('COUNT', col('ExtracurricularMember.id')), 'total_members']
            ],
            where: whereMember,
            include: [{ model: Extracurricular, as: 'extracurricular', attributes: ['id', 'name'], required: true }],
            group: ['extracurricular_id', 'extracurricular.id'],
            order: [[literal('total_members'), 'DESC']],
            limit: 1
        });

        const active = await ExtracurricularSession.findAll({
            attributes: [
                'extracurricular_id',
                [fn('COUNT', col('ExtracurricularSession.id')), 'total_sessions']
            ],
            where: whereSession,
            include: [{ model: Extracurricular, as: 'extracurricular', attributes: ['id', 'name'], required: true }],
            group: ['extracurricular_id', 'extracurricular.id'],
            order: [[literal('total_sessions'), 'DESC']],
            limit: 1
        });

        const today = new Date().toISOString().slice(0, 10);
        const attendanceToday = await ExtracurricularStudentAttendance.count({
            include: [{
                model: ExtracurricularSession,
                as: 'session',
                required: true,
                where: { session_date: today, ...(filters.extracurricular_id ? { extracurricular_id: filters.extracurricular_id } : {}) }
            }]
        });

        return {
            total_extracurricular: totalExtracurricular,
            total_members: totalMembers,
            most_popular_extracurricular: popular[0]?.extracurricular?.name || '-',
            most_active_extracurricular: active[0]?.extracurricular?.name || '-',
            total_sessions: totalSessions,
            total_attendance_today: attendanceToday,
            filters
        };
    }

    async _schoolHeader() {
        const school = await SchoolProfile.findOne({ order: [['id', 'ASC']] });
        return {
            name: school?.name || 'Sekolah',
            address: school?.address || '-',
            city: school?.city || '',
            generated_at: new Date().toISOString()
        };
    }

    _buildExportColumns(reportType) {
        const columnMap = {
            members: [
                { header: 'Ekskul', key: 'extracurricular_name' },
                { header: 'Siswa', key: 'student_name' },
                { header: 'Kelas', key: 'class_name' },
                { header: 'Join Date', key: 'join_date' },
                { header: 'Status', key: 'status' }
            ],
            'student-attendance': [
                { header: 'Siswa', key: 'student_name' },
                { header: 'Ekskul', key: 'extracurricular_name' },
                { header: 'Present', key: 'total_present' },
                { header: 'Absent', key: 'total_absent' },
                { header: 'Sick', key: 'total_sick' },
                { header: 'Permit', key: 'total_permit' },
                { header: 'Attendance %', key: 'attendance_percentage' }
            ],
            'coach-attendance': [
                { header: 'Pelatih', key: 'coach_name' },
                { header: 'Ekskul', key: 'extracurricular_name' },
                { header: 'Total Sesi', key: 'total_sessions' },
                { header: 'Present', key: 'total_present' },
                { header: 'Late', key: 'total_late' },
                { header: 'Absent', key: 'total_absent' }
            ],
            'student-progress': [
                { header: 'Siswa', key: 'student_name' },
                { header: 'Ekskul', key: 'extracurricular_name' },
                { header: 'Aspek', key: 'aspect_name' },
                { header: 'Score', key: 'score' },
                { header: 'Predicate', key: 'predicate' },
                { header: 'Note', key: 'note' }
            ],
            sessions: [
                { header: 'Tanggal', key: 'session_date' },
                { header: 'Ekskul', key: 'extracurricular_name' },
                { header: 'Pelatih', key: 'coach_name' },
                { header: 'Total Siswa', key: 'total_students' },
                { header: 'Total Hadir', key: 'total_present' },
                { header: 'Materi', key: 'material' },
                { header: 'Catatan', key: 'notes' }
            ],
            ranking: [
                { header: 'Siswa', key: 'student_name' },
                { header: 'Ekskul', key: 'extracurricular_name' },
                { header: 'Attendance %', key: 'attendance_percentage' },
                { header: 'Ranking', key: 'ranking_position' }
            ],
            dashboard: [
                { header: 'Metric', key: 'metric' },
                { header: 'Value', key: 'value' }
            ]
        };
        return columnMap[reportType] || [];
    }

    async _getReportData(reportType, query = {}, exportAll = false) {
        const exportQuery = exportAll ? { ...query, page: 1, limit: 5000 } : query;
        switch (reportType) {
            case 'members': return this.getMembersReport(exportQuery);
            case 'student-attendance': return this.getStudentAttendanceReport(exportQuery);
            case 'coach-attendance': return this.getCoachAttendanceReport(exportQuery);
            case 'student-progress': return this.getStudentProgressReport(exportQuery);
            case 'sessions': return this.getSessionsReport(exportQuery);
            case 'ranking': return this.getRankingReport(exportQuery);
            case 'dashboard': return this.getDashboardReport(exportQuery);
            default: {
                const err = new Error('Tipe laporan tidak valid');
                err.statusCode = 400;
                err.errorCode = 'VALIDATION_ERROR';
                throw err;
            }
        }
    }

    async getReportByType(reportType, query = {}) {
        return this._getReportData(reportType, query, false);
    }

    async exportExcel(reportType, query = {}) {
        const data = await this._getReportData(reportType, query, true);
        const school = await this._schoolHeader();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Laporan ${reportType}`);

        worksheet.addRow([school.name]);
        worksheet.addRow([`Alamat: ${school.address}`]);
        worksheet.addRow([`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`]);
        worksheet.addRow([`Filter: ${JSON.stringify(data.filters || {})}`]);
        worksheet.addRow([]);

        const columns = this._buildExportColumns(reportType);
        worksheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.header.length + 6 }));
        worksheet.getRow(6).font = { bold: true };

        let items = data.items || [];
        if (reportType === 'dashboard') {
            items = [
                { metric: 'Total Extracurricular', value: data.total_extracurricular },
                { metric: 'Total Members', value: data.total_members },
                { metric: 'Most Popular Extracurricular', value: data.most_popular_extracurricular },
                { metric: 'Most Active Extracurricular', value: data.most_active_extracurricular },
                { metric: 'Total Sessions', value: data.total_sessions },
                { metric: 'Total Attendance Today', value: data.total_attendance_today }
            ];
        }

        items.forEach((item) => worksheet.addRow(item));
        worksheet.columns.forEach((colDef) => {
            let maxLength = colDef.header.length;
            worksheet.eachRow((row) => {
                const cell = row.getCell(colDef.key);
                const len = String(cell.value || '').length;
                if (len > maxLength) maxLength = len;
            });
            colDef.width = Math.min(50, maxLength + 2);
        });

        return workbook;
    }

    async exportPdf(reportType, query = {}) {
        const data = await this._getReportData(reportType, query, true);
        const school = await this._schoolHeader();
        const columns = this._buildExportColumns(reportType);
        let items = data.items || [];

        if (reportType === 'dashboard') {
            items = [
                { metric: 'Total Extracurricular', value: data.total_extracurricular },
                { metric: 'Total Members', value: data.total_members },
                { metric: 'Most Popular Extracurricular', value: data.most_popular_extracurricular },
                { metric: 'Most Active Extracurricular', value: data.most_active_extracurricular },
                { metric: 'Total Sessions', value: data.total_sessions },
                { metric: 'Total Attendance Today', value: data.total_attendance_today }
            ];
        }

        return new Promise((resolve, reject) => {
            const buffers = [];
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            doc.fontSize(14).font('Helvetica-Bold').text(school.name, { align: 'center' });
            doc.moveDown(0.2);
            doc.fontSize(9).font('Helvetica').text(school.address, { align: 'center' });
            doc.moveDown(0.8);
            doc.fontSize(12).font('Helvetica-Bold').text(`Laporan ${reportType}`, { align: 'left' });
            doc.fontSize(9).font('Helvetica').text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`);
            doc.text(`Filter: ${JSON.stringify(data.filters || {})}`);
            doc.moveDown(0.6);

            const headers = columns.map((c) => c.header);
            const keys = columns.map((c) => c.key);
            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
            const colWidth = pageWidth / Math.max(headers.length, 1);
            let y = doc.y;

            const drawHeader = () => {
                doc.font('Helvetica-Bold').fontSize(8);
                headers.forEach((h, idx) => {
                    doc.text(String(h), doc.page.margins.left + (idx * colWidth), y, { width: colWidth - 4 });
                });
                y += 16;
                doc.moveTo(doc.page.margins.left, y - 4).lineTo(doc.page.width - doc.page.margins.right, y - 4).strokeColor('#cccccc').stroke();
            };
            drawHeader();

            doc.font('Helvetica').fontSize(8);
            for (const item of items) {
                if (y > doc.page.height - doc.page.margins.bottom - 20) {
                    doc.addPage();
                    y = doc.page.margins.top;
                    drawHeader();
                    doc.font('Helvetica').fontSize(8);
                }
                keys.forEach((key, idx) => {
                    const value = item[key] === undefined || item[key] === null ? '-' : String(item[key]);
                    doc.text(value, doc.page.margins.left + (idx * colWidth), y, { width: colWidth - 4 });
                });
                y += 14;
            }

            doc.fontSize(8).fillColor('#666').text('Generated by Edulite System', doc.page.margins.left, doc.page.height - doc.page.margins.bottom + 4, { align: 'right' });
            doc.end();
        });
    }
}

module.exports = new ExtracurricularReportService();
