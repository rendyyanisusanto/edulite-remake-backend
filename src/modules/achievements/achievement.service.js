const { Achievement, User, AcademicYear } = require('../../models');
const { Op } = require('sequelize');

class AchievementService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';

        const where = {};
        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { level: { [Op.like]: `%${search}%` } },
                { organizer: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Achievement.findAndCountAll({
            where,
            include: [
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] },
                { model: User, as: 'creator', attributes: ['id', 'name'] }
            ],
            limit,
            offset,
            order: [[query.sortBy || 'created_at', query.sortDesc === 'true' ? 'DESC' : 'ASC']]
        });

        return { totalItems: count, achievements: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    async findById(id) {
        const item = await Achievement.findByPk(id, {
            include: [
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] },
                { model: User, as: 'creator', attributes: ['id', 'name'] }
            ]
        });
        if (!item) throw new Error('Achievement not found');
        return item;
    }

    async create(data) {
        return await Achievement.create(data);
    }

    async update(id, data) {
        const item = await this.findById(id);
        return await item.update(data);
    }

    async delete(id) {
        const item = await this.findById(id);
        return await item.destroy();
    }
}

module.exports = new AchievementService();
