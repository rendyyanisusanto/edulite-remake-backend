const { CounselingSession, CounselingCase, User, Student } = require('../../models');
const { Op } = require('sequelize');

const USER_ATTRS = ['id', 'name'];

class CounselingSessionService {
    async findAllByCaseId(caseId, query = {}) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows } = await CounselingSession.findAndCountAll({
            where: { case_id: caseId },
            include: [
                { model: User, as: 'counselor', attributes: USER_ATTRS }
            ],
            limit,
            offset,
            order: [['session_date', 'DESC'], ['created_at', 'DESC']]
        });

        return {
            totalItems: count,
            counselingSessions: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const item = await CounselingSession.findByPk(id, {
            include: [
                { 
                    model: CounselingCase, 
                    as: 'counseling_case',
                    include: [{ model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] }]
                },
                { model: User, as: 'counselor', attributes: USER_ATTRS }
            ]
        });
        if (!item) throw new Error('Counseling session not found');
        return item;
    }

    async create(data) {
        return await CounselingSession.create(data);
    }

    async update(id, data) {
        const item = await this.findById(id);
        return await item.update(data);
    }

    async delete(id) {
        const item = await this.findById(id);
        return await item.destroy();
    }

    async getCaseTimeline(caseId) {
        const caseDetail = await CounselingCase.findByPk(caseId, {
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                { model: User, as: 'creator', attributes: USER_ATTRS },
                { model: User, as: 'updater', attributes: USER_ATTRS },
            ]
        });

        if (!caseDetail) throw new Error('Counseling case not found');

        const sessions = await CounselingSession.findAll({
            where: { case_id: caseId },
            include: [{ model: User, as: 'counselor', attributes: USER_ATTRS }],
            order: [['session_date', 'DESC'], ['created_at', 'DESC']]
        });

        const timeline = [];

        // Add creation event
        timeline.push({
            type: 'CASE_CREATED',
            date: caseDetail.created_at,
            title: 'Kasus Dibuat',
            description: `Kasus "${caseDetail.issue_title}" didaftarkan oleh ${caseDetail.creator?.name || 'Sistem'}.`,
            icon: 'plus',
            color: 'blue'
        });

        // Add session events
        sessions.forEach(session => {
            timeline.push({
                type: 'SESSION',
                date: session.session_date || session.created_at,
                title: `Sesi Konseling (${session.method})`,
                description: session.notes,
                counselor: session.counselor?.name || 'Konselor',
                duration: session.duration,
                next_plan: session.next_plan,
                id: session.id,
                icon: 'chat',
                color: 'green'
            });
        });

        // Add status change if updated_by exists and different from created_at
        if (caseDetail.updated_at && new Date(caseDetail.updated_at).getTime() > new Date(caseDetail.created_at).getTime() + 1000) {
            timeline.push({
                type: 'CASE_UPDATED',
                date: caseDetail.updated_at,
                title: 'Pembaruan Kasus',
                description: `Status kasus saat ini: ${caseDetail.status}.`,
                updater: caseDetail.updater?.name || 'Sistem',
                icon: 'pencil',
                color: 'orange'
            });
        }

        // Sort full timeline by date descending
        return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

module.exports = new CounselingSessionService();
