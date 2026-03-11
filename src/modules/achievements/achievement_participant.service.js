const { AchievementParticipant, Achievement, Student, Teacher, AchievementResult } = require('../../models');

class AchievementParticipantService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;

        const where = {};
        if (query.achievement_id) where.achievement_id = query.achievement_id;
        if (query.student_id) where.student_id = query.student_id;
        if (query.teacher_id) where.teacher_id = query.teacher_id;

        const { count, rows } = await AchievementParticipant.findAndCountAll({
            where,
            include: [
                { model: Achievement, as: 'achievement', attributes: ['id', 'title', 'level'] },
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                { model: Teacher, as: 'teacher', attributes: ['id', 'full_name', 'nip'] },
                { model: AchievementResult, as: 'result', attributes: ['id', 'rank', 'score'] }
            ],
            limit,
            offset,
            order: [['id', 'DESC']]
        });

        return { totalItems: count, participants: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    async findById(id) {
        const item = await AchievementParticipant.findByPk(id, {
            include: [
                { model: Achievement, as: 'achievement' },
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                { model: Teacher, as: 'teacher', attributes: ['id', 'full_name', 'nip'] },
                { model: AchievementResult, as: 'result' }
            ]
        });
        if (!item) throw new Error('Achievement Participant not found');
        return item;
    }

    async create(data) {
        return await AchievementParticipant.create(data);
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

module.exports = new AchievementParticipantService();
