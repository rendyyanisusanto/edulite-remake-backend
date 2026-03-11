const { AchievementResult, AchievementParticipant, Achievement, Student, Teacher, AchievementPointRule } = require('../../models');

class AchievementResultService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;

        const where = {};
        if (query.participant_id) where.participant_id = query.participant_id;

        const { count, rows } = await AchievementResult.findAndCountAll({
            where,
            include: [
                {
                    model: AchievementParticipant,
                    as: 'participant',
                    include: [
                        { model: Achievement, as: 'achievement', attributes: ['id', 'title'] },
                        { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                        { model: Teacher, as: 'teacher', attributes: ['id', 'full_name', 'nip'] }
                    ]
                }
            ],
            limit,
            offset,
            order: [['id', 'DESC']]
        });

        return { totalItems: count, results: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    async findById(id) {
        const item = await AchievementResult.findByPk(id, {
            include: [
                {
                    model: AchievementParticipant,
                    as: 'participant',
                    include: [
                        { model: Achievement, as: 'achievement' },
                        { model: Student, as: 'student' },
                        { model: Teacher, as: 'teacher' }
                    ]
                },
                {
                    model: AchievementPointRule,
                    as: 'point_rule',
                    attributes: ['id', 'level', 'rank', 'category', 'points']
                }
            ]
        });
        if (!item) throw new Error('Achievement Result not found');
        return item;
    }

    async create(data) {
        // Validation: ensure participant doesn't already have a result
        const existing = await AchievementResult.findOne({ where: { participant_id: data.participant_id } });
        if (existing) throw new Error('Participant already has a result recorded');
        return await AchievementResult.create(data);
    }

    async update(id, data) {
        const item = await this.findById(id);

        // Validation: ensure participant_id change is valid
        if (data.participant_id && data.participant_id !== item.participant_id) {
            const existing = await AchievementResult.findOne({ where: { participant_id: data.participant_id } });
            if (existing) throw new Error('Target participant already has a result recorded');
        }

        return await item.update(data);
    }

    async delete(id) {
        const item = await this.findById(id);
        return await item.destroy();
    }
}

module.exports = new AchievementResultService();
