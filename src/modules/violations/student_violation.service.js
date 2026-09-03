const { StudentViolation, Student, ViolationType, ViolationLevel, User, AcademicYear } = require('../../models');
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
        if (query.academic_year_id) {
            where.academic_year_id = query.academic_year_id;
        }

        if (query.date_from && query.date_to) {
            where.date = {
                [Op.between]: [query.date_from, query.date_to]
            };
        } else if (query.date_from) {
            where.date = { [Op.gte]: query.date_from };
        } else if (query.date_to) {
            where.date = { [Op.lte]: query.date_to };
        }

        if (query.student_id) {
            where.student_id = query.student_id;
        }

        if (query.class_id && query.academic_year_id) {
            const { StudentClassHistory } = require('../../models');
            const classHistories = await StudentClassHistory.findAll({
                where: { class_id: query.class_id, academic_year_id: query.academic_year_id },
                attributes: ['student_id']
            });
            const studentIdsInClass = classHistories.map(h => h.student_id);
            // If student_id was also specified, only use it if it's in the class.
            if (where.student_id) {
                if (!studentIdsInClass.includes(Number(where.student_id))) {
                    where.student_id = -1; // impossible match
                }
            } else {
                where.student_id = { [Op.in]: studentIdsInClass };
            }
        }

        const { count, rows } = await StudentViolation.findAndCountAll({
            where,
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                { model: ViolationType, as: 'type', attributes: ['id', 'name', 'point'], include: [{ model: ViolationLevel, as: 'level', attributes: ['id', 'name'] }] },
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] }
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
                { model: User, as: 'approver', attributes: ['id', 'name'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] }
            ]
        });
        if (!item) throw new Error('Student Violation not found');

        const crypto = require('crypto');
        const secret = process.env.VERIFY_SECRET || 'edulite-secret-2026';
        item.dataValues.verify_token = crypto.createHash('md5').update(`violation-${item.id}-${secret}`).digest('hex');

        return item;
    }

    async create(data) {
        if (!data.academic_year_id) {
            const activeYear = await AcademicYear.findOne({ where: { is_active: true } });
            if (activeYear) {
                data.academic_year_id = activeYear.id;
            }
        }
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

    async getTrend(query) {
        const { sequelize } = require('../../models');
        const where = {};

        if (query.academic_year_id) {
            where.academic_year_id = query.academic_year_id;
        }

        if (query.date_from && query.date_to) {
            where.date = {
                [Op.between]: [query.date_from, query.date_to]
            };
        } else if (query.date_from) {
            where.date = { [Op.gte]: query.date_from };
        } else if (query.date_to) {
            where.date = { [Op.lte]: query.date_to };
        }

        if (query.student_id) {
            where.student_id = query.student_id;
        }

        if (query.class_id && query.academic_year_id) {
            const { StudentClassHistory } = require('../../models');
            const classHistories = await StudentClassHistory.findAll({
                where: { class_id: query.class_id, academic_year_id: query.academic_year_id },
                attributes: ['student_id']
            });
            const studentIdsInClass = classHistories.map(h => h.student_id);
            if (where.student_id) {
                if (!studentIdsInClass.includes(Number(where.student_id))) {
                    where.student_id = -1; // impossible match
                }
            } else {
                where.student_id = { [Op.in]: studentIdsInClass };
            }
        }

        let groupFormat = '%Y-%m-%d'; // daily
        if (query.period === 'weekly') {
            // Tahun-Minggu (misal 2026-35)
            groupFormat = '%x-%v';
        } else if (query.period === 'monthly') {
            // Tahun-Bulan (misal 2026-09)
            groupFormat = '%Y-%m';
        }

        const trends = await StudentViolation.findAll({
            where,
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('date'), groupFormat), 'period_label'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total']
            ],
            group: ['period_label'],
            order: [[sequelize.literal('period_label'), 'ASC']],
            raw: true
        });

        return trends;
    }
}

module.exports = new StudentViolationService();
