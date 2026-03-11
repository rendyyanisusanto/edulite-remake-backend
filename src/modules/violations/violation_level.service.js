const { ViolationLevel } = require('../../models');
const { Op } = require('sequelize');

class ViolationLevelService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';

        const where = {};
        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        const { count, rows } = await ViolationLevel.findAndCountAll({
            where,
            limit,
            offset,
            order: [[query.sortBy || 'min_point', query.sortDesc === 'true' ? 'DESC' : 'ASC']]
        });

        return { totalItems: count, violationLevels: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    async findById(id) {
        const item = await ViolationLevel.findByPk(id);
        if (!item) throw new Error('Violation Level not found');
        return item;
    }

    async create(data) { return await ViolationLevel.create(data); }
    async update(id, data) { const item = await this.findById(id); return await item.update(data); }
    async delete(id) { const item = await this.findById(id); return await item.destroy(); }
}

module.exports = new ViolationLevelService();
