const { AchievementPointRule } = require('../../models');
const { Op } = require('sequelize');

class AchievementPointRuleService {
    async getAll(query) {
        const { page = 1, limit = 10, search, sortBy = 'points', sortDesc = 'true' } = query;
        const offset = (page - 1) * limit;

        const where = {};
        if (search) {
            where[Op.or] = [
                { category: { [Op.like]: `%${search}%` } },
                { level: { [Op.like]: `%${search}%` } },
                { rank: { [Op.like]: `%${search}%` } }
            ];
        }

        const order = [[sortBy, sortDesc === 'true' ? 'DESC' : 'ASC']];

        const { count, rows } = await AchievementPointRule.findAndCountAll({
            where,
            offset: parseInt(offset),
            limit: parseInt(limit),
            order
        });

        return {
            totalItems: count,
            rules: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        };
    }

    async getById(id) {
        const rule = await AchievementPointRule.findByPk(id);
        if (!rule) throw new Error('Point rule not found');
        return rule;
    }

    async create(data) {
        return await AchievementPointRule.create(data);
    }

    async update(id, data) {
        const rule = await this.getById(id);
        return await rule.update(data);
    }

    async delete(id) {
        const rule = await this.getById(id);
        const hasResults = await rule.countResults();
        if (hasResults > 0) {
            throw new Error('Cannot delete point rule because it is used by achievement results');
        }
        await rule.destroy();
        return true;
    }
}

module.exports = new AchievementPointRuleService();
