'use strict';
const { UserAttendance, AttendanceShift, User } = require('../../models');
const { Op } = require('sequelize');

class AttendanceMonitoringService {
    async findByDate(query = {}) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 25;
        const offset = (page - 1) * limit;

        const targetDate = query.date || new Date().toISOString().slice(0, 10);
        const where = { attendance_date: targetDate };

        if (query.user_id) where.user_id = query.user_id;
        if (query.attendance_status) where.attendance_status = query.attendance_status;
        if (query.missing_clock_in === 'true') where.clock_in_at = null;
        if (query.missing_clock_out === 'true') where.clock_out_at = null;

        // User search by name
        const userWhere = { is_active: true };
        if (query.search) {
            userWhere.name = { [Op.like]: `%${query.search}%` };
        }

        const { count, rows } = await UserAttendance.findAndCountAll({
            where,
            include: [
                {
                    model: User, as: 'user', attributes: ['id', 'name', 'email'],
                    where: userWhere
                },
                { model: AttendanceShift, as: 'shift', attributes: ['id', 'name', 'clock_in_start', 'clock_in_end'] }
            ],
            limit,
            offset,
            order: [['clock_in_at', 'ASC']]
        });

        return { totalItems: count, attendances: rows, totalPages: Math.ceil(count / limit), currentPage: page, date: targetDate };
    }

    async findById(id) {
        const item = await UserAttendance.findByPk(id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
                { model: AttendanceShift, as: 'shift' }
            ]
        });
        if (!item) throw new Error('Attendance record not found');
        return item;
    }

    async getSummaryByDate(date) {
        const targetDate = date || new Date().toISOString().slice(0, 10);
        const rows = await UserAttendance.findAll({
            where: { attendance_date: targetDate },
            attributes: ['attendance_status']
        });
        const summary = { PRESENT: 0, LATE: 0, ABSENT: 0, INCOMPLETE: 0, total: rows.length };
        for (const r of rows) {
            if (summary[r.attendance_status] !== undefined) summary[r.attendance_status]++;
        }
        return { date: targetDate, ...summary };
    }
}

module.exports = new AttendanceMonitoringService();
