const { StudentClassHistory, Student, AcademicYear, Grade, Class, User } = require('../../models');
const { Op } = require('sequelize');

class StudentClassHistoryService {

    async getAll(filters = {}) {
        const { page = 1, limit = 10, search = '', academic_year_id, grade_id, class_id, assignment_type } = filters;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const whereClause = {};
        if (academic_year_id) whereClause.academic_year_id = academic_year_id;
        if (grade_id) whereClause.grade_id = grade_id;
        if (class_id) whereClause.class_id = class_id;
        if (assignment_type) whereClause.assignment_type = assignment_type;

        const searchCondition = search
            ? {
                [Op.or]: [
                    { '$student.full_name$': { [Op.like]: `%${search}%` } },
                    { '$student.nis$': { [Op.like]: `%${search}%` } },
                    { '$student.nisn$': { [Op.like]: `%${search}%` } }
                ]
            }
            : {};

        const { count, rows } = await StudentClassHistory.findAndCountAll({
            where: { ...whereClause, ...searchCondition },
            include: [
                { model: Student, as: 'student', attributes: ['id', 'nis', 'nisn', 'full_name', 'gender'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] },
                { model: Grade, as: 'grade', attributes: ['id', 'name'] },
                { model: Class, as: 'class_info', attributes: ['id', 'name'] },
                { model: User, as: 'assigner', attributes: ['id', 'name'] }
            ],
            limit: parseInt(limit),
            offset,
            order: [['created_at', 'DESC']],
            subQuery: false
        });

        return {
            totalItems: count,
            histories: rows,
            totalPages: Math.ceil(count / parseInt(limit)),
            currentPage: parseInt(page)
        };
    }

    async getById(id) {
        const history = await StudentClassHistory.findByPk(id, {
            include: [
                { model: Student, as: 'student', attributes: ['id', 'nis', 'nisn', 'full_name', 'gender', 'date_of_birth'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name', 'is_active'] },
                { model: Grade, as: 'grade', attributes: ['id', 'name', 'level'] },
                { model: Class, as: 'class_info', attributes: ['id', 'name', 'capacity'] },
                { model: User, as: 'assigner', attributes: ['id', 'name'] }
            ]
        });
        if (!history) throw new Error('Data riwayat kelas tidak ditemukan');
        return history;
    }

    async getStudentHistory(student_id) {
        const student = await Student.findByPk(student_id, {
            attributes: ['id', 'nis', 'nisn', 'full_name', 'gender', 'date_of_birth']
        });
        if (!student) throw new Error('Siswa tidak ditemukan');

        const histories = await StudentClassHistory.findAll({
            where: { student_id },
            include: [
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name', 'is_active'] },
                { model: Grade, as: 'grade', attributes: ['id', 'name', 'level'] },
                { model: Class, as: 'class_info', attributes: ['id', 'name', 'capacity'] },
                { model: User, as: 'assigner', attributes: ['id', 'name'] }
            ],
            order: [['created_at', 'DESC']]
        });

        return { student, histories };
    }

    async create(data) {
        const existing = await StudentClassHistory.findOne({
            where: {
                student_id: data.student_id,
                academic_year_id: data.academic_year_id
            }
        });

        if (existing) {
            throw new Error('Siswa sudah memiliki kelas di tahun ajaran ini');
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
