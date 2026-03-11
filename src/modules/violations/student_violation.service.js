const { StudentViolation, Student, ViolationType, ViolationLevel, User } = require('../../models');
const { Op } = require('sequelize');

class StudentViolationService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';

        const where = {};
        if (search) {
            // Search by location or description
            where[Op.or] = [
                { location: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await StudentViolation.findAndCountAll({
            where,
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                { model: ViolationType, as: 'type', attributes: ['id', 'name', 'point'], include: [{ model: ViolationLevel, as: 'level', attributes: ['id', 'name'] }] },
                { model: User, as: 'creator', attributes: ['id', 'name'] }
            ],
            limit,
            offset,
            order: [[query.sortBy || 'date', query.sortDesc === 'true' ? 'DESC' : 'ASC']]
        });

        return { totalItems: count, studentViolations: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    async findById(id) {
        const item = await StudentViolation.findByPk(id, {
            include: [
                { model: Student, as: 'student' },
                { model: ViolationType, as: 'type', include: [{ model: ViolationLevel, as: 'level' }] },
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: User, as: 'approver', attributes: ['id', 'name'] }
            ]
        });
        if (!item) throw new Error('Student Violation not found');
        return item;
    }

    async create(data) {
        return await StudentViolation.create(data);
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

module.exports = new StudentViolationService();
