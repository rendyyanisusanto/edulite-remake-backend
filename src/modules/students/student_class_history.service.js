const { StudentClassHistory, Student, AcademicYear, Grade, Class, User } = require('../../models');
const { Op } = require('sequelize');

class StudentClassHistoryService {

    async getAll(filters = {}) {
        const { page = 1, limit = 10, search = '', academic_year_id, grade_id, class_id } = filters;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (search) {
            whereClause['$student.full_name$'] = { [Op.like]: `%${search}%` };
        }
        if (academic_year_id) whereClause.academic_year_id = academic_year_id;
        if (grade_id) whereClause.grade_id = grade_id;
        if (class_id) whereClause.class_id = class_id;

        const { count, rows } = await StudentClassHistory.findAndCountAll({
            where: whereClause,
            include: [
                { model: Student, as: 'student', attributes: ['id', 'nis', 'full_name'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] },
                { model: Grade, as: 'grade', attributes: ['id', 'name'] },
                { model: Class, as: 'class_info', attributes: ['id', 'name'] },
                { model: User, as: 'assigner', attributes: ['id', 'name'] } // Using 'assigner' as per model definition
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        return {
            totalItems: count,
            histories: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        };
    }

    async getById(id) {
        const history = await StudentClassHistory.findByPk(id, {
            include: [
                { model: Student, as: 'student', attributes: ['id', 'nis', 'full_name'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] },
                { model: Grade, as: 'grade', attributes: ['id', 'name'] },
                { model: Class, as: 'class_info', attributes: ['id', 'name'] },
                { model: User, as: 'assigner', attributes: ['id', 'name'] }
            ]
        });
        if (!history) throw new Error('Student class history record not found');
        return history;
    }

    async create(data) {
        // Optional: Check if the student already has an active class history for this academic year
        // For simplicity, we just create the record. If they need "only one per year", we would check here.
        const existing = await StudentClassHistory.findOne({
            where: {
                student_id: data.student_id,
                academic_year_id: data.academic_year_id
            }
        });

        if (existing) {
            // Usually, assigning a new class in the same year is a transfer. 
            // In a strict system, this might throw an error or deactivate the old one.
            // We'll allow it but you may want to manage it later.
        }

        return await StudentClassHistory.create(data);
    }

    async update(id, data) {
        const history = await this.getById(id);
        return await history.update(data);
    }

    async delete(id) {
        const history = await this.getById(id);
        return await history.destroy();
    }
}

module.exports = new StudentClassHistoryService();
