'use strict';
const { AttendanceShift } = require('../../models');
const { Op } = require('sequelize');

class AttendanceShiftService {
    async findAll(query = {}) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const offset = (page - 1) * limit;

        const where = {};
        if (query.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${query.search}%` } },
                { code: { [Op.like]: `%${query.search}%` } }
            ];
        }
        if (typeof query.is_active !== 'undefined' && query.is_active !== '') {
            where.is_active = query.is_active === 'true' || query.is_active === true;
        }

        const { count, rows } = await AttendanceShift.findAndCountAll({
            where,
            limit,
            offset,
            order: [['name', 'ASC']]
        });

        return { totalItems: count, shifts: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    async findAllActive() {
        return await AttendanceShift.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
    }

    async findById(id) {
        const item = await AttendanceShift.findByPk(id);
        if (!item) throw new Error('Attendance shift not found');
        return item;
    }

    async create(data) {
        const { name, code, clock_in_start, clock_in_end, clock_out_start, clock_out_end, late_after, is_active } = data;
        if (!name) throw new Error('Shift name is required');
        if (!clock_in_start) throw new Error('Clock in start time is required');
        if (!clock_in_end) throw new Error('Clock in end time is required');
        return await AttendanceShift.create({ name, code, clock_in_start, clock_in_end, clock_out_start, clock_out_end, late_after, is_active });
    }

    async update(id, data) {
        const item = await this.findById(id);
        const { name, code, clock_in_start, clock_in_end, clock_out_start, clock_out_end, late_after, is_active } = data;
        return await item.update({ name, code, clock_in_start, clock_in_end, clock_out_start, clock_out_end, late_after, is_active });
    }

    async toggleActive(id) {
        const item = await this.findById(id);
        return await item.update({ is_active: !item.is_active });
    }

    async delete(id) {
        const item = await this.findById(id);
        return await item.destroy();
    }
}

module.exports = new AttendanceShiftService();
