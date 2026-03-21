'use strict';
const { UserAttendance, AttendanceRequest, User } = require('../../models');
const { Op, fn, col, literal } = require('sequelize');
const ExcelJS = require('exceljs');

class AttendanceReportService {
    async getSummary(query = {}) {
        const where = {};
        if (query.user_id) where.user_id = query.user_id;
        if (query.date_from || query.date_to) {
            where.attendance_date = {};
            if (query.date_from) where.attendance_date[Op.gte] = query.date_from;
            if (query.date_to) where.attendance_date[Op.lte] = query.date_to;
        }

        const rows = await UserAttendance.findAll({
            where,
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
            attributes: ['user_id', 'attendance_status', 'clock_in_at', 'clock_out_at', 'work_duration_minutes', 'attendance_date'],
        });

        // Aggregate stats
        const stats = { total: rows.length, present: 0, late: 0, absent: 0, incomplete: 0, totalWorkMinutes: 0 };
        const perUser = {};

        for (const r of rows) {
            const s = r.attendance_status;
            if (s === 'PRESENT') stats.present++;
            else if (s === 'LATE') stats.late++;
            else if (s === 'ABSENT') stats.absent++;
            else if (s === 'INCOMPLETE') stats.incomplete++;
            if (r.work_duration_minutes) stats.totalWorkMinutes += r.work_duration_minutes;

            const uid = r.user_id;
            if (!perUser[uid]) {
                perUser[uid] = {
                    user_id: uid,
                    user_name: r.user?.name || '',
                    total: 0, present: 0, late: 0, absent: 0, incomplete: 0
                };
            }
            perUser[uid].total++;
            if (s === 'PRESENT') perUser[uid].present++;
            else if (s === 'LATE') perUser[uid].late++;
            else if (s === 'ABSENT') perUser[uid].absent++;
            else if (s === 'INCOMPLETE') perUser[uid].incomplete++;
        }

        // Pending requests in range
        const reqWhere = { request_status: 'PENDING' };
        if (query.date_from || query.date_to) {
            reqWhere.attendance_date = {};
            if (query.date_from) reqWhere.attendance_date[Op.gte] = query.date_from;
            if (query.date_to) reqWhere.attendance_date[Op.lte] = query.date_to;
        }
        const pendingRequests = await AttendanceRequest.count({ where: reqWhere });

        return {
            summary: { ...stats, pending_requests: pendingRequests },
            per_user: Object.values(perUser)
        };
    }

    async exportExcel(query = {}) {
        const { summary, per_user } = await this.getSummary(query);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Edulite';
        workbook.created = new Date();

        const ws = workbook.addWorksheet('Laporan Absensi');
        ws.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Nama', key: 'user_name', width: 28 },
            { header: 'Total Hari', key: 'total', width: 12 },
            { header: 'Hadir', key: 'present', width: 10 },
            { header: 'Terlambat', key: 'late', width: 12 },
            { header: 'Tidak Hadir', key: 'absent', width: 14 },
            { header: 'Tidak Lengkap', key: 'incomplete', width: 15 }
        ];

        ws.getRow(1).font = { bold: true };
        per_user.forEach((row, i) => {
            ws.addRow({ no: i + 1, ...row });
        });

        // Summary sheet
        const wsSummary = workbook.addWorksheet('Ringkasan');
        wsSummary.addRow(['Total Records', summary.total]);
        wsSummary.addRow(['Hadir', summary.present]);
        wsSummary.addRow(['Terlambat', summary.late]);
        wsSummary.addRow(['Tidak Hadir', summary.absent]);
        wsSummary.addRow(['Tidak Lengkap', summary.incomplete]);
        wsSummary.addRow(['Pending Requests', summary.pending_requests]);

        return workbook;
    }
}

module.exports = new AttendanceReportService();
