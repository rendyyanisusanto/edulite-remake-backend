const { ViolationType, ViolationLevel } = require('../../models');
const { Op } = require('sequelize');

class ViolationTypeService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';

        const where = {};
        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        const { count, rows } = await ViolationType.findAndCountAll({
            where,
            include: [{ model: ViolationLevel, as: 'level', attributes: ['id', 'name'] }],
            limit,
            offset,
            order: [[query.sortBy || 'name', query.sortDesc === 'true' ? 'DESC' : 'ASC']]
        });

        return { totalItems: count, violationTypes: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    async findById(id) {
        const item = await ViolationType.findByPk(id, {
            include: [{ model: ViolationLevel, as: 'level' }]
        });
        if (!item) throw new Error('Violation Type not found');
        return item;
    }

    async create(data) { return await ViolationType.create(data); }
    async update(id, data) { const item = await this.findById(id); return await item.update(data); }
    async delete(id) { const item = await this.findById(id); return await item.destroy(); }
}

module.exports = new ViolationTypeService();
