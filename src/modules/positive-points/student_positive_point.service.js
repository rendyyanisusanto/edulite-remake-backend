const { StudentPositivePoint, Student, PositivePointType, AcademicYear, User } = require('../../models');
const { Op } = require('sequelize');

class StudentPositivePointService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';

        const where = {};
        if (search) {
            where[Op.or] = [
                { location: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await StudentPositivePoint.findAndCountAll({
            where,
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                { model: PositivePointType, as: 'type', attributes: ['id', 'name', 'category', 'points'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] },
                { model: User, as: 'creator', attributes: ['id', 'name'] }
            ],
            limit,
            offset,
            order: [[query.sortBy || 'date', query.sortDesc === 'true' ? 'DESC' : 'ASC']]
        });

        return { totalItems: count, studentPositivePoints: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    async findById(id) {
        const item = await StudentPositivePoint.findByPk(id, {
            include: [
                { model: Student, as: 'student' },
                { model: PositivePointType, as: 'type' },
                { model: AcademicYear, as: 'academic_year' },
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: User, as: 'approver', attributes: ['id', 'name'] }
            ]
        });
        if (!item) throw new Error('Student Positive Point not found');
        return item;
    }

    async create(data) {
        return await StudentPositivePoint.create(data);
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

module.exports = new StudentPositivePointService();
