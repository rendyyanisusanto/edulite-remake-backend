const { CounselingCase, Student, User, CounselingSession } = require('../../models');
const { Op } = require('sequelize');

const STUDENT_ATTRS = ['id', 'full_name', 'nis'];
const USER_ATTRS = ['id', 'name'];

class CounselingCaseService {
    _buildWhere(query) {
        const where = {};
        const search = query.search || '';

        if (search) {
            where[Op.or] = [
                { issue_title: { [Op.like]: `%${search}%` } },
                { issue_description: { [Op.like]: `%${search}%` } },
                { '$student.full_name$': { [Op.like]: `%${search}%` } },
            ];
        }

        if (query.source) where.source = query.source;
        if (query.category) where.category = query.category;
        if (query.level) where.level = query.level;
        if (query.status) where.status = query.status;

        if (query.date_from || query.date_to) {
            where.created_at = {};
            if (query.date_from) where.created_at[Op.gte] = new Date(query.date_from);
            if (query.date_to) {
                const to = new Date(query.date_to);
                to.setHours(23, 59, 59, 999);
                where.created_at[Op.lte] = to;
            }
        }

        if (query.student_id) where.student_id = query.student_id;

        return where;
    }

    _baseInclude() {
        return [
            { model: Student, as: 'student', attributes: STUDENT_ATTRS },
            { model: User, as: 'creator', attributes: USER_ATTRS },
            { model: User, as: 'updater', attributes: USER_ATTRS },
        ];
    }

    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const where = this._buildWhere(query);
        const order = [[query.sortBy || 'created_at', query.sortDesc === 'false' ? 'ASC' : 'DESC']];

        const { count, rows } = await CounselingCase.findAndCountAll({
            where,
            include: this._baseInclude(),
            limit,
            offset,
            order,
            subQuery: false,
        });

        return {
            totalItems: count,
            counselingCases: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        };
    }

    async findById(id) {
        const item = await CounselingCase.findByPk(id, {
            include: [
                { model: Student, as: 'student' },
                { model: User, as: 'creator', attributes: USER_ATTRS },
                { model: User, as: 'updater', attributes: USER_ATTRS },
            ],
        });
        if (!item) throw new Error('Counseling case not found');
        return item;
    }

    async findByStudentId(studentId, query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows } = await CounselingCase.findAndCountAll({
            where: { student_id: studentId },
            include: [
                { model: User, as: 'creator', attributes: USER_ATTRS },
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']],
        });

        return {
            totalItems: count,
            counselingCases: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        };
    }

    async getSummaryStats() {
        const [total, open, inProgress, resolved] = await Promise.all([
            CounselingCase.count(),
            CounselingCase.count({ where: { status: 'OPEN' } }),
            CounselingCase.count({ where: { status: 'IN_PROGRESS' } }),
            CounselingCase.count({ where: { status: 'RESOLVED' } }),
        ]);
        return { total, open, inProgress, resolved };
    }

    async getFollowups(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;

        // Fetch all cases but order by updated_at or created_at descending.
        // Also include latest session.
        const { count, rows } = await CounselingCase.findAndCountAll({
            include: [
                { model: Student, as: 'student', attributes: STUDENT_ATTRS },
                { 
                    model: CounselingSession, 
                    as: 'sessions', 
                    limit: 1, 
                    order: [['session_date', 'DESC'], ['created_at', 'DESC']],
                    include: [{ model: User, as: 'counselor', attributes: USER_ATTRS }]
                }
            ],
            limit,
            offset,
            order: [['updated_at', 'DESC'], ['created_at', 'DESC']],
            distinct: true
        });

        // Compute stats for followups page
        const totalCases = await CounselingCase.count();
        const casesWithSessions = await CounselingSession.count({ distinct: true, col: 'case_id' });
        const resolvedCases = await CounselingCase.count({ where: { status: ['RESOLVED', 'CLOSED'] } });
        // Simplified follow-up logic: cases that are NOT resolved/closed and have at least one session with a next_plan
        const pendingFollowUpCases = await CounselingSession.count({ 
            where: { next_plan: { [Op.ne]: null, [Op.not]: '' } },
            include: [{ model: CounselingCase, as: 'counseling_case', where: { status: { [Op.notIn]: ['RESOLVED', 'CLOSED'] } }, required: true }],
            distinct: true, 
            col: 'case_id' 
        });

        const noSessionYet = totalCases - casesWithSessions;

        return {
            totalItems: count,
            followups: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            stats: { totalCases, casesWithSessions, pendingFollowUpCases, noSessionYet, resolvedCases }
        };
    }


    async create(data, userId) {
        return await CounselingCase.create({ ...data, created_by: userId, updated_by: userId });
    }

    async update(id, data, userId) {
        const item = await this.findById(id);
        return await item.update({ ...data, updated_by: userId });
    }

    async updateStatus(id, status, userId) {
        const item = await this.findById(id);
        return await item.update({ status, updated_by: userId });
    }

    async delete(id) {
        const item = await this.findById(id);
        return await item.destroy();
    }
}

module.exports = new CounselingCaseService();
