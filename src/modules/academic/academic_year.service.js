const { AcademicYear } = require('../../models');
const { Op } = require('sequelize');

class AcademicYearService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';

        const where = {};
        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        const { count, rows } = await AcademicYear.findAndCountAll({
            where,
            limit,
            offset,
            order: [[query.sortBy || 'start_date', query.sortDesc === 'true' ? 'DESC' : 'ASC']]
        });

        return {
            totalItems: count,
            academicYears: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const item = await AcademicYear.findByPk(id);
        if (!item) throw new Error('Academic Year not found');
        return item;
    }

    async create(data) {
        // If this one is set as active, deactivate others
        if (data.is_active) {
            await AcademicYear.update({ is_active: false }, { where: {} });
        }
        return await AcademicYear.create(data);
    }

    async update(id, data) {
        const item = await this.findById(id);
        if (data.is_active) {
            await AcademicYear.update({ is_active: false }, { where: { id: { [Op.ne]: id } } });
        }
        return await item.update(data);
    }

    async delete(id) {
        const item = await this.findById(id);
        return await item.destroy();
    }
}

module.exports = new AcademicYearService();
