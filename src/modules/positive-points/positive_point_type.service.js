const { PositivePointType } = require('../../models');
const { Op } = require('sequelize');

class PositivePointTypeService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';

        const where = {};
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { category: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await PositivePointType.findAndCountAll({
            where,
            limit,
            offset,
            order: [[query.sortBy || 'name', query.sortDesc === 'true' ? 'DESC' : 'ASC']]
        });

        return { totalItems: count, positivePointTypes: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    async findById(id) {
        const item = await PositivePointType.findByPk(id);
        if (!item) throw new Error('Positive Point Type not found');
        return item;
    }

    async create(data) { return await PositivePointType.create(data); }
    async update(id, data) { const item = await this.findById(id); return await item.update(data); }
    async delete(id) { const item = await this.findById(id); return await item.destroy(); }
}

module.exports = new PositivePointTypeService();
