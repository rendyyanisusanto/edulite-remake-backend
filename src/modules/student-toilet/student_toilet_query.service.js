'use strict';

const { Op, fn, col, literal } = require('sequelize');
const db = require('../../models');
const {
    StudentToiletPermission,
    StudentToiletScanLog,
    Student,
    Class
} = db;

const { toDateOnly } = require('../student-attendance/student_attendance.helper');

class StudentToiletQueryService {
    async findToday(query = {}) {
        return this.findAll({ ...query, date: toDateOnly(new Date()), limit: query.limit || 100 });
    }

    async findAll(query = {}) {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        const offset = (page - 1) * limit;
        const targetDate = query.date || toDateOnly(new Date());

        const where = { permission_date: targetDate };
        if (query.class_id) where.class_id = query.class_id;
        if (query.student_id) where.student_id = query.student_id;
        if (query.status) where.status = query.status;

        const studentWhere = {};
        const keyword = query.keyword || query.search;
        if (keyword) {
            studentWhere[Op.or] = [
                { full_name: { [Op.like]: `%${keyword}%` } },
                { nis: { [Op.like]: `%${keyword}%` } },
                { rfid_code: { [Op.like]: `%${keyword}%` } }
            ];
        }

        const { count, rows } = await StudentToiletPermission.findAndCountAll({
            where,
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis', 'rfid_code'], where: Object.keys(studentWhere).length ? studentWhere : undefined },
                { model: Class, as: 'class_info', attributes: ['id', 'name'], required: false }
            ],
            order: [['id', 'DESC']],
            limit,
            offset,
            distinct: true
        });

        return {
            totalItems: count,
            permissions: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            date: targetDate
        };
    }

    async getSummary(query = {}) {
        const targetDate = query.date || toDateOnly(new Date());
        const where = { permission_date: targetDate };
        if (query.class_id) where.class_id = query.class_id;

        const aggregateRows = await StudentToiletPermission.findAll({
            attributes: [
                'student_id',
                [fn('COUNT', col('id')), 'total_trips'],
                [fn('SUM', col('duration_minutes')), 'total_duration_minutes']
            ],
            where,
            group: ['student_id'],
            raw: true
        });

        const students = await Student.findAll({
            where: { id: { [Op.in]: aggregateRows.map((item) => item.student_id) } },
            attributes: ['id', 'full_name', 'nis']
        });
        const studentMap = new Map(students.map((item) => [item.id, item]));

        const byStudent = aggregateRows.map((item) => {
            const student = studentMap.get(item.student_id);
            return {
                student_id: item.student_id,
                full_name: student ? student.full_name : '-',
                nis: student ? student.nis : '-',
                total_trips: Number(item.total_trips || 0),
                total_duration_minutes: Number(item.total_duration_minutes || 0)
            };
        });

        const rankingMostTrips = [...byStudent].sort((a, b) => b.total_trips - a.total_trips).slice(0, 10);
        const rankingLongestDuration = [...byStudent].sort((a, b) => b.total_duration_minutes - a.total_duration_minutes).slice(0, 10);

        const currentlyOut = await StudentToiletPermission.findAll({
            where: { ...where, status: 'OUT' },
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                { model: Class, as: 'class_info', attributes: ['id', 'name'], required: false }
            ],
            order: [['exit_at', 'ASC']]
        });

        return {
            date: targetDate,
            by_student: byStudent,
            ranking_most_trips: rankingMostTrips,
            ranking_longest_duration: rankingLongestDuration,
            currently_out: currentlyOut
        };
    }

    async getTodayScanLogs(limit = 50) {
        const today = toDateOnly(new Date());
        return StudentToiletScanLog.findAll({
            where: literal(`DATE(scanned_at) = '${today}'`),
            include: [{ model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'], required: false }],
            order: [['id', 'DESC']],
            limit
        });
    }
}

module.exports = new StudentToiletQueryService();

