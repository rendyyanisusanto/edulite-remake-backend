const { Class, Grade, Department, Teacher } = require('../../models');
const { Op } = require('sequelize');

class ClassService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';

        const where = {};
        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        const { count, rows } = await Class.findAndCountAll({
            where,
            include: [
                { model: Grade, as: 'grade', attributes: ['id', 'name', 'level'] },
                { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
                { model: Teacher, as: 'homeroom_teacher', attributes: ['id', 'full_name', 'nip'] }
            ],
            limit,
            offset,
            order: [[query.sortBy || 'name', query.sortDesc === 'true' ? 'DESC' : 'ASC']]
        });

        return {
            totalItems: count,
            classes: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const item = await Class.findByPk(id, {
            include: [
                { model: Grade, as: 'grade' },
                { model: Department, as: 'department' },
                { model: Teacher, as: 'homeroom_teacher' }
            ]
        });
        if (!item) throw new Error('Class not found');
        return item;
    }

    async create(data) {
        return await Class.create(data);
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

module.exports = new ClassService();
