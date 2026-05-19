'use strict';

const { Op, fn, col, literal } = require('sequelize');
const db = require('../../models');
const pdfService = require('../../services/pdfService');
const activeItemsTpl = require('../../templates/studentItemReports/activeItemsReport');
const dailyLoansTpl = require('../../templates/studentItemReports/dailyLoansReport');
const unreturnedItemsTpl = require('../../templates/studentItemReports/unreturnedItemsReport');
const finalReturnsTpl = require('../../templates/studentItemReports/finalReturnsReport');
const problemItemsTpl = require('../../templates/studentItemReports/problemItemsReport');
const studentBehaviorTpl = require('../../templates/studentItemReports/studentBehaviorReport');
const classSummaryTpl = require('../../templates/studentItemReports/classSummaryReport');
const studentHistoryTpl = require('../../templates/studentItemReports/studentHistoryReport');

const { StudentItemDeposit, StudentItemLoan, StudentItemFinalReturn, StudentItemCategory, StudentItemDepositSetting, Student, Class, AcademicYear, User, StudentClassHistory } = db;

const dt = (v) => (v ? new Date(v).toLocaleString('id-ID') : '-');
const mins = (a, b) => (!a || !b ? 0 : Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000)));

class StudentItemReportService {
    async getActiveAcademicYearId() {
        try {
            const [rows] = await db.sequelize.query('SELECT active_academic_year_id FROM app_settings ORDER BY id DESC LIMIT 1');
            if (rows[0] && rows[0].active_academic_year_id) return rows[0].active_academic_year_id;
        } catch (error) {
            // fallback jika tabel app_settings belum tersedia di environment tertentu
        }
        const year = await AcademicYear.findOne({ where: { is_active: true }, attributes: ['id'] });
        return year ? year.id : null;
    }

    async resolveFilters(query = {}) {
        const yearId = query.academic_year_id || await this.getActiveAcademicYearId();
        return { ...query, academic_year_id: yearId || query.academic_year_id || null, page: parseInt(query.page, 10) || 1, limit: parseInt(query.limit, 10) || 20 };
    }

    buildDepositWhere(f) {
        const where = {};
        if (f.student_id) where.student_id = f.student_id;
        if (f.class_id) where.class_id = f.class_id;
        if (f.academic_year_id) where.academic_year_id = f.academic_year_id;
        if (f.category_id) where.category_id = f.category_id;
        if (f.current_status) where.current_status = f.current_status;
        if (f.date_from || f.date_to) {
            where.deposit_date = {};
            if (f.date_from) where.deposit_date[Op.gte] = `${f.date_from} 00:00:00`;
            if (f.date_to) where.deposit_date[Op.lte] = `${f.date_to} 23:59:59`;
        }
        return where;
    }

    buildLoanWhere(f) {
        const where = {};
        if (f.student_id) where.student_id = f.student_id;
        if (f.loan_status) where.status = f.loan_status;
        if (f.date_from || f.date_to) {
            where.loan_date = {};
            if (f.date_from) where.loan_date[Op.gte] = f.date_from;
            if (f.date_to) where.loan_date[Op.lte] = f.date_to;
        }
        return where;
    }

    paginationResult(rows, count, page, limit) {
        return { items: rows, totalItems: count, totalPages: Math.ceil(count / limit) || 1, currentPage: page };
    }

    async getSummary(query = {}) {
        const f = await this.resolveFilters(query);
        const today = new Date().toISOString().slice(0, 10);
        const setting = await StudentItemDepositSetting.findOne({ where: { is_active: true }, order: [['id', 'DESC']] });

        const depositWhere = this.buildDepositWhere(f);
        const loanWhere = this.buildLoanWhere(f);

        const [total_items, total_active_items, total_deposited, total_borrowed, total_final_returned, total_lost, total_damaged] = await Promise.all([
            StudentItemDeposit.count({ where: depositWhere }),
            StudentItemDeposit.count({ where: { ...depositWhere, current_status: { [Op.in]: ['DEPOSITED', 'BORROWED'] } } }),
            StudentItemDeposit.count({ where: { ...depositWhere, current_status: 'DEPOSITED' } }),
            StudentItemDeposit.count({ where: { ...depositWhere, current_status: 'BORROWED' } }),
            StudentItemDeposit.count({ where: { ...depositWhere, current_status: 'RETURNED' } }),
            StudentItemDeposit.count({ where: { ...depositWhere, current_status: 'LOST' } }),
            StudentItemDeposit.count({ where: { ...depositWhere, current_status: 'DAMAGED' } })
        ]);

        const loans = await StudentItemLoan.findAll({ where: loanWhere, include: [{ model: StudentItemDeposit, as: 'deposit', attributes: ['class_id', 'category_id', 'academic_year_id'] }] });
        const todayLoans = loans.filter((x) => x.loan_date === today);
        const activeLoans = loans.filter((x) => x.status === 'BORROWED');
        const unreturnedToday = loans.filter((x) => x.status === 'BORROWED' && x.loan_date === today);
        const returned = loans.filter((x) => x.status === 'RETURNED' && x.returned_at && x.borrowed_at);
        const avgDur = returned.length ? Math.round(returned.reduce((s, x) => s + mins(x.borrowed_at, x.returned_at), 0) / returned.length) : 0;

        const deadline = setting && setting.return_deadline_time;
        let onTime = 0;
        if (deadline && returned.length) {
            const [h, m, s] = deadline.split(':').map((x) => parseInt(x, 10));
            const ontimeCount = returned.filter((x) => {
                const d = new Date(x.borrowed_at);
                d.setHours(h || 0, m || 0, s || 0, 0);
                return new Date(x.returned_at) <= d;
            }).length;
            onTime = Math.round((ontimeCount / returned.length) * 100);
        }

        const category_summary = await StudentItemDeposit.findAll({
            where: depositWhere,
            attributes: ['category_id', [fn('COUNT', col('StudentItemDeposit.id')), 'total']],
            include: [{ model: StudentItemCategory, as: 'category', attributes: ['name'] }],
            group: ['category_id'],
            order: [[literal('total'), 'DESC']],
            limit: 10
        });

        const dailyMap = {};
        loans.forEach((l) => { dailyMap[l.loan_date] = (dailyMap[l.loan_date] || 0) + 1; });
        const daily_loan_trend = Object.keys(dailyMap).sort().map((d) => ({ date: d, total: dailyMap[d] }));

        return {
            summary: {
                total_items,
                total_active_items,
                total_deposited,
                total_borrowed,
                total_final_returned,
                total_lost,
                total_damaged,
                total_today_loans: todayLoans.length,
                total_active_loans: activeLoans.length,
                total_unreturned_today: unreturnedToday.length,
                average_loan_duration_minutes: avgDur,
                on_time_return_rate: onTime
            },
            category_summary,
            class_summary: [],
            daily_loan_trend,
            top_borrowers: [],
            top_late_students: [],
            recent_activities: []
        };
    }

    async getActiveItems(query = {}) {
        const f = await this.resolveFilters(query);
        const where = this.buildDepositWhere(f);
        where.current_status = { [Op.in]: ['DEPOSITED', 'BORROWED'] };
        const offset = (f.page - 1) * f.limit;
        const data = await StudentItemDeposit.findAndCountAll({
            where,
            include: [
                { model: Student, as: 'student', attributes: ['full_name', 'nis', 'nisn'] },
                { model: Class, as: 'class', attributes: ['name'], required: false },
                { model: StudentItemCategory, as: 'category', attributes: ['name'], required: false },
                { model: StudentItemLoan, as: 'loans', where: { status: 'BORROWED' }, required: false, attributes: ['borrowed_at'] }
            ],
            limit: f.limit, offset, distinct: true, order: [['deposit_date', 'DESC']]
        });
        const items = data.rows.map((d) => ({
            code: d.code, student_name: d.student?.full_name || '-', nis: d.student?.nis || '-', nisn: d.student?.nisn || '-', class_name: d.class?.name || '-',
            category_name: d.category?.name || '-', item_name: d.item_name, brand: d.brand || '-', model: d.model || '-', deposit_date: d.deposit_date,
            storage_location: d.storage_location || '-', current_status: d.current_status, active_loan_borrowed_at: d.loans?.[0]?.borrowed_at || null,
            days_deposited: Math.max(0, Math.floor((Date.now() - new Date(d.deposit_date).getTime()) / 86400000))
        }));
        return this.paginationResult(items, data.count, f.page, f.limit);
    }

    async getDailyLoans(query = {}) {
        const f = await this.resolveFilters(query);
        const where = this.buildLoanWhere(f);
        const offset = (f.page - 1) * f.limit;
        const data = await StudentItemLoan.findAndCountAll({
            where,
            include: [
                { model: Student, as: 'student', attributes: ['full_name', 'nis'] },
                { model: StudentItemDeposit, as: 'deposit', attributes: ['code', 'item_name', 'class_id', 'category_id'], include: [{ model: Class, as: 'class', attributes: ['name'], required: false }, { model: StudentItemCategory, as: 'category', attributes: ['name'], required: false }] }
            ],
            limit: f.limit, offset, distinct: true, order: [['borrowed_at', 'DESC']]
        });
        const items = data.rows.map((l) => ({
            id: l.id, loan_date: l.loan_date, student_name: l.student?.full_name || '-', nis: l.student?.nis || '-', class_name: l.deposit?.class?.name || '-',
            deposit_code: l.deposit?.code || '-', item_name: l.deposit?.item_name || '-', category_name: l.deposit?.category?.name || '-',
            borrowed_at: l.borrowed_at, returned_at: l.returned_at, duration_minutes: mins(l.borrowed_at, l.returned_at || new Date()),
            status: l.status, borrow_method: l.borrow_method, return_method: l.return_method
        }));
        return this.paginationResult(items, data.count, f.page, f.limit);
    }

    async getUnreturnedItems(query = {}) {
        const f = await this.resolveFilters(query);
        const setting = await StudentItemDepositSetting.findOne({ where: { is_active: true }, order: [['id', 'DESC']] });
        const deadline = setting && setting.return_deadline_time;
        const data = await StudentItemLoan.findAndCountAll({
            where: { ...this.buildLoanWhere(f), status: 'BORROWED' },
            include: [
                { model: Student, as: 'student', attributes: ['full_name', 'nis'] },
                { model: StudentItemDeposit, as: 'deposit', attributes: ['item_name'], include: [{ model: Class, as: 'class', attributes: ['name'], required: false }, { model: StudentItemCategory, as: 'category', attributes: ['name'], required: false }] }
            ],
            order: [['borrowed_at', 'DESC']]
        });
        const now = new Date();
        const items = data.rows.map((l) => {
            let risk = 'NORMAL'; let overdue = 0;
            if (deadline) {
                const [h, m, s] = deadline.split(':').map((x) => parseInt(x, 10));
                const d = new Date(l.borrowed_at); d.setHours(h || 0, m || 0, s || 0, 0);
                overdue = Math.max(0, Math.round((now - d) / 60000));
                if (overdue > 0) risk = 'TERLAMBAT';
                else if (Math.round((d - now) / 60000) <= 30) risk = 'MENDEKATI_BATAS';
            }
            return {
                student_name: l.student?.full_name || '-', nis: l.student?.nis || '-', class_name: l.deposit?.class?.name || '-', item_name: l.deposit?.item_name || '-',
                category_name: l.deposit?.category?.name || '-', borrowed_at: l.borrowed_at, duration_minutes: mins(l.borrowed_at, now),
                return_deadline_time: deadline || null, overdue_minutes: overdue, risk_status: risk
            };
        });
        const start = (f.page - 1) * f.limit;
        return this.paginationResult(items.slice(start, start + f.limit), data.count, f.page, f.limit);
    }

    async getFinalReturns(query = {}) {
        const f = await this.resolveFilters(query);
        const where = {};
        if (f.date_from || f.date_to) {
            where.return_date = {};
            if (f.date_from) where.return_date[Op.gte] = `${f.date_from} 00:00:00`;
            if (f.date_to) where.return_date[Op.lte] = `${f.date_to} 23:59:59`;
        }
        const data = await StudentItemFinalReturn.findAndCountAll({
            where,
            include: [{ model: StudentItemDeposit, as: 'deposit', include: [{ model: Student, as: 'student', attributes: ['full_name', 'nis'] }, { model: Class, as: 'class', attributes: ['name'], required: false }, { model: StudentItemCategory, as: 'category', attributes: ['name'], required: false }] }, { model: User, as: 'handedBy', attributes: ['name'], required: false }],
            order: [['return_date', 'DESC']]
        });
        const items = data.rows.map((x) => ({
            id: x.id, return_date: x.return_date, deposit_code: x.deposit?.code || '-', student_name: x.deposit?.student?.full_name || '-', nis: x.deposit?.student?.nis || '-',
            class_name: x.deposit?.class?.name || '-', item_name: x.deposit?.item_name || '-', category_name: x.deposit?.category?.name || '-',
            returned_to: x.returned_to, returned_to_type: x.returned_to_type, returned_to_relation: x.returned_to_relation || '-', return_reason: x.return_reason || '-', condition_out: x.condition_out || '-', handed_by_name: x.handedBy?.name || '-'
        }));
        const start = (f.page - 1) * f.limit;
        return this.paginationResult(items.slice(start, start + f.limit), data.count, f.page, f.limit);
    }

    async getProblemItems(query = {}) {
        const f = await this.resolveFilters(query);
        const where = this.buildDepositWhere(f);
        where.current_status = { [Op.in]: ['LOST', 'DAMAGED'] };
        const data = await StudentItemDeposit.findAndCountAll({
            where,
            include: [{ model: Student, as: 'student', attributes: ['full_name', 'nis'] }, { model: Class, as: 'class', attributes: ['name'], required: false }, { model: StudentItemCategory, as: 'category', attributes: ['name'], required: false }, { model: User, as: 'updatedBy', attributes: ['name'], required: false }],
            order: [['updated_at', 'DESC']]
        });
        const items = data.rows.map((d) => ({
            code: d.code, student_name: d.student?.full_name || '-', nis: d.student?.nis || '-', class_name: d.class?.name || '-', category_name: d.category?.name || '-', item_name: d.item_name,
            current_status: d.current_status, deposit_date: d.deposit_date, last_borrowed_at: null, last_returned_at: null, notes: d.notes || '-', updated_by_name: d.updatedBy?.name || '-'
        }));
        const start = (f.page - 1) * f.limit;
        return this.paginationResult(items.slice(start, start + f.limit), data.count, f.page, f.limit);
    }

    behaviorLabel(score) {
        if (score >= 90) return 'SANGAT_DISIPLIN';
        if (score >= 75) return 'DISIPLIN';
        if (score >= 60) return 'CUKUP';
        if (score >= 40) return 'PERLU_PEMBINAAN';
        return 'BERISIKO';
    }

    async getStudentBehavior(query = {}) {
        const f = await this.resolveFilters(query);
        const students = await Student.findAll({ attributes: ['id', 'full_name', 'nis', 'nisn'] });
        const setting = await StudentItemDepositSetting.findOne({ where: { is_active: true }, order: [['id', 'DESC']] });
        const deadline = setting && setting.return_deadline_time;
        const result = [];
        for (const st of students) {
            const deposits = await StudentItemDeposit.findAll({ where: { student_id: st.id }, include: [{ model: Class, as: 'class', attributes: ['name'], required: false }] });
            if (f.class_id && !deposits.some((d) => String(d.class_id || '') === String(f.class_id))) continue;
            const loans = await StudentItemLoan.findAll({ where: { student_id: st.id } });
            const returned = loans.filter((x) => x.status === 'RETURNED');
            const active = loans.filter((x) => x.status === 'BORROWED');
            let late = 0; let unreturnedLate = 0;
            if (deadline) {
                const [h, m, s] = deadline.split(':').map((x) => parseInt(x, 10));
                returned.forEach((x) => { const d = new Date(x.borrowed_at); d.setHours(h || 0, m || 0, s || 0, 0); if (x.returned_at && new Date(x.returned_at) > d) late += 1; });
                active.forEach((x) => { const d = new Date(x.borrowed_at); d.setHours(h || 0, m || 0, s || 0, 0); if (new Date() > d) unreturnedLate += 1; });
            }
            const lost = deposits.filter((d) => d.current_status === 'LOST').length;
            const damaged = deposits.filter((d) => d.current_status === 'DAMAGED').length;
            const avg = returned.length ? Math.round(returned.reduce((s, x) => s + mins(x.borrowed_at, x.returned_at), 0) / returned.length) : 0;
            const longest = returned.length ? Math.max(...returned.map((x) => mins(x.borrowed_at, x.returned_at))) : 0;
            const ontimeRate = returned.length && deadline ? Math.max(0, Math.round(((returned.length - late) / returned.length) * 100)) : 0;
            let score = 100 - (late * 5) - (unreturnedLate * 10) - (lost * 40) - (damaged * 20);
            if (loans.length >= 10 && late === 0 && lost === 0 && damaged === 0) score += 5;
            score = Math.max(0, Math.min(100, score));
            result.push({
                student_id: st.id, student_name: st.full_name, nis: st.nis, nisn: st.nisn, class_name: deposits[0]?.class?.name || '-',
                total_items_deposited: deposits.length, total_loans: loans.length, total_returned: returned.length, total_active_borrowed: active.length,
                total_late_returns: late, total_unreturned: active.length, total_lost_items: lost, total_damaged_items: damaged,
                average_duration_minutes: avg, longest_duration_minutes: longest, on_time_return_rate: ontimeRate, behavior_score: score, behavior_label: this.behaviorLabel(score)
            });
        }
        const start = (f.page - 1) * f.limit;
        return this.paginationResult(result.slice(start, start + f.limit), result.length, f.page, f.limit);
    }

    async getClassSummary(query = {}) {
        const behavior = await this.getStudentBehavior({ ...query, page: 1, limit: 10000 });
        const map = {};
        behavior.items.forEach((x) => {
            const key = x.class_name || '-';
            if (!map[key]) map[key] = { class_name: key, total_students_with_items: 0, total_items: 0, total_active_items: 0, total_deposited: 0, total_borrowed: 0, total_final_returned: 0, total_loans: 0, total_late_returns: 0, total_lost: 0, total_damaged: 0, avgScore: 0, scoreCount: 0 };
            map[key].total_students_with_items += (x.total_items_deposited > 0 ? 1 : 0);
            map[key].total_items += x.total_items_deposited;
            map[key].total_borrowed += x.total_active_borrowed;
            map[key].total_loans += x.total_loans;
            map[key].total_late_returns += x.total_late_returns;
            map[key].total_lost += x.total_lost_items;
            map[key].total_damaged += x.total_damaged_items;
            map[key].avgScore += x.behavior_score;
            map[key].scoreCount += 1;
        });
        const items = Object.values(map).map((x, i) => ({
            class_id: i + 1, class_name: x.class_name, total_students_with_items: x.total_students_with_items, total_items: x.total_items,
            total_active_items: x.total_borrowed, total_deposited: 0, total_borrowed: x.total_borrowed, total_final_returned: 0,
            total_loans: x.total_loans, total_late_returns: x.total_late_returns, total_lost: x.total_lost, total_damaged: x.total_damaged,
            average_behavior_score: x.scoreCount ? Math.round(x.avgScore / x.scoreCount) : 0
        }));
        return { items, totalItems: items.length, totalPages: 1, currentPage: 1 };
    }

    async getStudentHistory(studentId) {
        const student = await Student.findByPk(studentId, { attributes: ['id', 'full_name', 'nis', 'nisn'] });
        if (!student) { const e = new Error('Siswa tidak ditemukan'); e.statusCode = 404; e.errorCode = 'NOT_FOUND'; throw e; }
        const deposits = await StudentItemDeposit.findAll({ where: { student_id: studentId }, include: [{ model: Class, as: 'class', attributes: ['name'], required: false }, { model: StudentItemCategory, as: 'category', attributes: ['name'], required: false }] });
        const loans = await StudentItemLoan.findAll({ where: { student_id: studentId }, include: [{ model: StudentItemDeposit, as: 'deposit', attributes: ['code', 'item_name'] }] });
        const finalReturns = await StudentItemFinalReturn.findAll({ include: [{ model: StudentItemDeposit, as: 'deposit', where: { student_id: studentId }, attributes: ['code', 'item_name'] }], required: false });
        const behavior = await this.getStudentBehavior({ page: 1, limit: 10000 });
        const me = behavior.items.find((x) => String(x.student_id) === String(studentId));
        return {
            student, class_info: deposits[0]?.class || null,
            summary: { total_items: deposits.length, active_items: deposits.filter((x) => ['DEPOSITED', 'BORROWED'].includes(x.current_status)).length, total_loans: loans.length, total_late: me?.total_late_returns || 0, behavior_score: me?.behavior_score || 100, behavior_label: me?.behavior_label || 'SANGAT_DISIPLIN' },
            items: deposits, loan_history: loans, final_returns: finalReturns, logs: []
        };
    }

    filtersToText(f) {
        const excluded = new Set(['page', 'limit']);
        const labels = {
            academic_year_id: 'Tahun Ajaran',
            class_id: 'Kelas',
            category_id: 'Kategori',
            student_id: 'Siswa',
            current_status: 'Status Barang',
            loan_status: 'Status Pinjam',
            date_from: 'Tanggal Dari',
            date_to: 'Tanggal Sampai',
            search: 'Pencarian'
        };
        const parts = Object.entries(f)
            .filter(([k, v]) => !excluded.has(k) && v !== null && v !== undefined && String(v).trim() !== '')
            .map(([k, v]) => `${labels[k] || k}: ${v}`);
        return parts.join(' | ');
    }

    buildReportHtml(type, payload, query, basePath, showToolbar = true) {
        const map = {
            'active-items': { tpl: activeItemsTpl, headers: ['Kode', 'Siswa', 'NIS', 'Kelas', 'Kategori', 'Barang', 'Status', 'Tanggal Titip'], rows: (x) => [x.code, x.student_name, x.nis, x.class_name, x.category_name, x.item_name, x.current_status, dt(x.deposit_date)] },
            'daily-loans': { tpl: dailyLoansTpl, headers: ['Tanggal', 'Siswa', 'NIS', 'Kelas', 'Kode', 'Barang', 'Pinjam', 'Kembali', 'Durasi', 'Status'], rows: (x) => [x.loan_date, x.student_name, x.nis, x.class_name, x.deposit_code, x.item_name, dt(x.borrowed_at), dt(x.returned_at), x.duration_minutes, x.status] },
            'unreturned-items': { tpl: unreturnedItemsTpl, headers: ['Siswa', 'NIS', 'Kelas', 'Barang', 'Pinjam', 'Durasi(mnt)', 'Deadline', 'Terlambat(mnt)', 'Risiko'], rows: (x) => [x.student_name, x.nis, x.class_name, x.item_name, dt(x.borrowed_at), x.duration_minutes, x.return_deadline_time || '-', x.overdue_minutes, x.risk_status] },
            'final-returns': { tpl: finalReturnsTpl, headers: ['Tanggal', 'Kode', 'Siswa', 'Kelas', 'Barang', 'Diambil Oleh', 'Tipe', 'Petugas'], rows: (x) => [dt(x.return_date), x.deposit_code, x.student_name, x.class_name, x.item_name, x.returned_to, x.returned_to_type, x.handed_by_name] },
            'problem-items': { tpl: problemItemsTpl, headers: ['Kode', 'Siswa', 'NIS', 'Kelas', 'Barang', 'Status', 'Tanggal Titip', 'Catatan'], rows: (x) => [x.code, x.student_name, x.nis, x.class_name, x.item_name, x.current_status, dt(x.deposit_date), x.notes] },
            'student-behavior': { tpl: studentBehaviorTpl, headers: ['Siswa', 'NIS', 'Kelas', 'Total Pinjam', 'Terlambat', 'Belum Kembali', 'Skor', 'Label'], rows: (x) => [x.student_name, x.nis, x.class_name, x.total_loans, x.total_late_returns, x.total_unreturned, x.behavior_score, x.behavior_label] },
            'class-summary': { tpl: classSummaryTpl, headers: ['Kelas', 'Siswa Menitipkan', 'Total Barang', 'Sedang Dipinjam', 'Total Pinjam', 'Terlambat', 'Hilang', 'Rusak', 'Rata-rata Skor'], rows: (x) => [x.class_name, x.total_students_with_items, x.total_items, x.total_borrowed, x.total_loans, x.total_late_returns, x.total_lost, x.total_damaged, x.average_behavior_score] }
        };
        const conf = map[type];
        const items = payload.items || [];
        return conf.tpl({
            schoolProfile: payload.schoolProfile || {},
            filtersText: this.filtersToText(query),
            summaryCards: [{ label: 'Total Data', value: payload.totalItems || items.length }],
            tableHeaders: conf.headers,
            tableRows: items.map(conf.rows),
            showToolbar,
            pdfUrl: `${basePath}/pdf?${new URLSearchParams(query).toString()}`
        });
    }

    async renderReport(type, query, mode, studentId = null) {
        const schoolProfile = await db.SchoolProfile.findOne();
        let payload;
        if (type === 'student-history') {
            const history = await this.getStudentHistory(studentId);
            payload = { items: history.loan_history.map((x) => ({ student_name: history.student.full_name, nis: history.student.nis, class_name: history.class_info?.name || '-', loan_date: x.loan_date, deposit_code: x.deposit?.code || '-', item_name: x.deposit?.item_name || '-', borrowed_at: x.borrowed_at, returned_at: x.returned_at, duration_minutes: mins(x.borrowed_at, x.returned_at || new Date()), status: x.status })), totalItems: history.loan_history.length, schoolProfile };
            type = 'daily-loans';
        } else {
            const mapFn = {
                'active-items': () => this.getActiveItems(query),
                'daily-loans': () => this.getDailyLoans(query),
                'unreturned-items': () => this.getUnreturnedItems(query),
                'final-returns': () => this.getFinalReturns(query),
                'problem-items': () => this.getProblemItems(query),
                'student-behavior': () => this.getStudentBehavior(query),
                'class-summary': () => this.getClassSummary(query)
            };
            payload = await mapFn[type]();
            payload.schoolProfile = schoolProfile;
        }
        const basePath = studentId ? `/api/v1/student-item-reports/student-history/${studentId}` : `/api/v1/student-item-reports/${type}`;
        const html = this.buildReportHtml(type, payload, query, basePath, mode === 'preview');
        if (mode === 'preview') return { type: 'html', content: html };
        const pdf = await pdfService.renderHtmlToPdf(html, { format: 'A4', margin: { top: '10mm', right: '8mm', bottom: '10mm', left: '8mm' }, printBackground: true });
        return { type: 'pdf', content: pdf };
    }
}

module.exports = new StudentItemReportService();
