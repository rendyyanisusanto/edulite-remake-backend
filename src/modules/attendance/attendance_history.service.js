'use strict';
const { UserAttendance, AttendanceShift, User } = require('../../models');
const { Op } = require('sequelize');

class AttendanceHistoryService {
    async findAll(query = {}) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 15;
        const offset = (page - 1) * limit;

        const where = {};
        if (query.user_id) where.user_id = query.user_id;
        if (query.attendance_status) where.attendance_status = query.attendance_status;
        if (query.date_from || query.date_to) {
            where.attendance_date = {};
            if (query.date_from) where.attendance_date[Op.gte] = query.date_from;
            if (query.date_to) where.attendance_date[Op.lte] = query.date_to;
        }

        const userWhere = { is_active: true };
        if (query.search) {
            userWhere.name = { [Op.like]: `%${query.search}%` };
        }

        const { count, rows } = await UserAttendance.findAndCountAll({
            where,
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'email'], where: userWhere },
                { model: AttendanceShift, as: 'shift', attributes: ['id', 'name', 'clock_in_start', 'clock_in_end'] }
            ],
            limit,
            offset,
            order: [['attendance_date', 'DESC'], ['clock_in_at', 'DESC']]
        });

        return { totalItems: count, attendances: rows, totalPages: Math.ceil(count / limit), currentPage: page };
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
}

module.exports = new AttendanceHistoryService();
