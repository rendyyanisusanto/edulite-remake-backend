'use strict';
const db = require('../../models');
const { Op } = require('sequelize');

class CbtQuestionBankService {

    // Check if the teacher has an active assignment for the given subject, grade, year, semester
    async _checkTeacherAssignment(userId, data) {
        // Teacher is in User model. Assignment requires checking teacher linked to User.
        const teacher = await db.Teacher.findOne({ where: { user_id: userId } });
        if (!teacher) {
            throw new Error('Anda tidak memiliki profil guru yang terhubung dengan akun ini.');
        }

        // Bypassing strict assignment validation based on user request (jangan terlalu banyak validasi)
        return true;
    }

    async findAll(options) {
        const {
            userId, hasViewAllAccess,
            page = 1, limit = 10, search,
            subject_id, grade_id, academic_year_id, semester, status,
            created_by, sort_by = 'created_at', sort_order = 'DESC'
        } = options;

        const offset = (page - 1) * limit;
        const where = {};

        if (!hasViewAllAccess) {
            where.created_by = userId;
        } else if (created_by) {
            where.created_by = created_by;
        }

        if (subject_id) where.subject_id = subject_id;
        if (grade_id) where.grade_id = grade_id;
        if (academic_year_id) where.academic_year_id = academic_year_id;
        if (semester) where.semester = semester;
        if (status) where.status = status;

        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        const allowedSorts = ['name', 'created_at', 'updated_at'];
        const order = allowedSorts.includes(sort_by)
            ? [[sort_by, sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']]
            : [['created_at', 'DESC']];

        const { count, rows } = await db.CbtQuestionBank.findAndCountAll({
            where,
            include: [
                { model: db.Subject, attributes: ['id', 'name', 'code'] },
                { model: db.Grade, attributes: ['id', 'name', 'level'] },
                { model: db.AcademicYear, attributes: ['id', 'name'] },
                { model: db.User, as: 'creator', attributes: ['id', 'username'] }
            ],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order,
            distinct: true
        });

        // Get question counts for each bank optimally
        // We will fetch all question counts grouped by bank_id in one go
        const bankIds = rows.map(r => r.id);
        let questionCounts = [];
        if (bankIds.length > 0) {
            questionCounts = await db.CbtQuestion.findAll({
                attributes: [
                    'question_bank_id',
                    [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total_questions']
                ],
                where: { question_bank_id: { [Op.in]: bankIds } },
                group: ['question_bank_id']
            });
        }

        const statsMap = {};
        for (let q of questionCounts) {
            statsMap[q.question_bank_id] = parseInt(q.getDataValue('total_questions') || 0, 10);
        }

        const mappedRows = rows.map(r => {
            const data = r.toJSON();
            data.total_questions = statsMap[r.id] || 0;
            return data;
        });

        return {
            total: count,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total_pages: Math.ceil(count / limit),
            data: mappedRows
        };
    }

    async findById(id, userId, hasViewAllAccess) {
        const bank = await db.CbtQuestionBank.findByPk(id, {
            include: [
                { model: db.Subject, attributes: ['id', 'name', 'code'] },
                { model: db.Grade, attributes: ['id', 'name', 'level'] },
                { model: db.AcademicYear, attributes: ['id', 'name'] },
                { model: db.User, as: 'creator', attributes: ['id', 'username'] }
            ]
        });

        if (!bank) {
            throw new Error('Bank Soal tidak ditemukan.');
        }

        if (!hasViewAllAccess && bank.created_by !== userId) {
            throw new Error('Anda tidak memiliki akses ke bank soal ini.');
        }

        const questions = await db.CbtQuestion.findAll({
            attributes: ['question_type', 'difficulty', 'status'],
            where: { question_bank_id: id }
        });

        let totalQuestions = questions.length;
        let typeStats = {};
        let difficultyStats = {};
        let statusStats = {};

        questions.forEach(q => {
            typeStats[q.question_type] = (typeStats[q.question_type] || 0) + 1;
            difficultyStats[q.difficulty] = (difficultyStats[q.difficulty] || 0) + 1;
            statusStats[q.status] = (statusStats[q.status] || 0) + 1;
        });

        const result = bank.toJSON();
        result.stats = {
            total: totalQuestions,
            by_type: typeStats,
            by_difficulty: difficultyStats,
            by_status: statusStats
        };

        return result;
    }

    async create(data, userId, hasViewAllAccess) {
        if (!data.name || !data.subject_id || !data.grade_id || !data.academic_year_id || !data.semester) {
            throw new Error('Nama, Mapel, Tingkat, Tahun Ajaran, dan Semester wajib diisi.');
        }

        if (!['GANJIL', 'GENAP'].includes(data.semester)) {
            throw new Error('Semester tidak valid.');
        }

        if (!hasViewAllAccess) {
            await this._checkTeacherAssignment(userId, data);
        }

        // Duplicate Check with different components allowed (name can be same if subject differs)
        // Handled naturally unless uniquely constrained. The requirements state combinations are valid.

        return await db.CbtQuestionBank.create({
            ...data,
            created_by: userId,
            status: 'ACTIVE'
        });
    }

    async update(id, data, userId, hasViewAllAccess) {
        const bank = await db.CbtQuestionBank.findByPk(id);

        if (!bank) throw new Error('Bank Soal tidak ditemukan.');
        if (!hasViewAllAccess && bank.created_by !== userId) {
            throw new Error('Anda tidak memiliki izin mengubah bank soal ini.');
        }

        // Only validate assignment if teacher modifies critical assignment-binded fields 
        // to a scope they don't own. 
        if (!hasViewAllAccess) {
            const checkData = {
                subject_id: data.subject_id || bank.subject_id,
                grade_id: data.grade_id || bank.grade_id,
                academic_year_id: data.academic_year_id || bank.academic_year_id,
                semester: data.semester || bank.semester
            };
            // Check if one of them is changed requiring reassignment check
            if (
                data.subject_id !== undefined && data.subject_id !== bank.subject_id ||
                data.grade_id !== undefined && data.grade_id !== bank.grade_id ||
                data.academic_year_id !== undefined && data.academic_year_id !== bank.academic_year_id ||
                data.semester !== undefined && data.semester !== bank.semester
            ) {
                await this._checkTeacherAssignment(userId, checkData);
            }
        }

        if (data.semester && !['GANJIL', 'GENAP'].includes(data.semester)) {
            throw new Error('Semester tidak valid.');
        }

        const updateData = { ...data, updated_by: userId };
        // Created_by should not be mutated
        delete updateData.created_by;

        await bank.update(updateData);
        return bank;
    }

    async archive(id, userId, hasViewAllAccess, newStatus) {
        const bank = await db.CbtQuestionBank.findByPk(id);

        if (!bank) throw new Error('Bank Soal tidak ditemukan.');
        if (!hasViewAllAccess && bank.created_by !== userId) {
            throw new Error('Anda tidak memiliki izin mengarsipkan bank soal ini.');
        }

        if (!['ACTIVE', 'ARCHIVED'].includes(newStatus)) {
            throw new Error('Status tidak valid.');
        }

        bank.status = newStatus;
        bank.updated_by = userId;
        await bank.save();
        return bank;
    }

    async remove(id, userId, hasViewAllAccess) {
        // Architecture request: "Bank soal berisi soal tidak boleh dihapus permanen"
        const bank = await db.CbtQuestionBank.findByPk(id);
        if (!bank) throw new Error('Bank Soal tidak ditemukan.');
        if (!hasViewAllAccess && bank.created_by !== userId) {
            throw new Error('Anda tidak memiliki izin menghapus bank soal ini.');
        }

        const questionCount = await db.CbtQuestion.count({ where: { question_bank_id: id } });
        if (questionCount > 0) {
            throw new Error('Bank soal berisi soal tidak boleh dihapus permanen. Gunakan fitur arsip.');
        }

        await bank.destroy(); // Paraonid = true, it means it will be soft deleted natively.
        return true;
    }
}

module.exports = new CbtQuestionBankService();
