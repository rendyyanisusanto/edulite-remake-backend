'use strict';

const { Op, fn, col, literal } = require('sequelize');
const db = require('../../models');
const {
    StudentDailyAttendance,
    Student,
    Class,
    StudentAttendanceShift,
    AcademicYear,
    StudentAttendanceScanLog
} = db;

const { toDateOnly } = require('./student_attendance.helper');

class StudentAttendanceQueryService {
    async findToday(query = {}) {
        return this.findAll({ ...query, date: toDateOnly(new Date()), limit: query.limit || 100 });
    }

    async findAll(query = {}) {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        const offset = (page - 1) * limit;
        const targetDate = query.date || toDateOnly(new Date());

        const where = { attendance_date: targetDate };
        if (query.class_id) where.class_id = query.class_id;
        if (query.attendance_status) where.attendance_status = query.attendance_status;

        const studentWhere = {};
        const keyword = query.keyword || query.search;
        if (keyword) {
            studentWhere[Op.or] = [
                { full_name: { [Op.like]: `%${keyword}%` } },
                { nis: { [Op.like]: `%${keyword}%` } },
                { rfid_code: { [Op.like]: `%${keyword}%` } }
            ];
        }

        const { count, rows } = await StudentDailyAttendance.findAndCountAll({
            where,
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis', 'rfid_code'], where: Object.keys(studentWhere).length ? studentWhere : undefined },
                { model: Class, as: 'class_info', attributes: ['id', 'name'], required: false },
                { model: StudentAttendanceShift, as: 'shift', attributes: ['id', 'name'], required: false },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'], required: false }
            ],
            order: [['clock_in_at', 'ASC']],
            limit,
            offset,
            distinct: true
        });

        return {
            totalItems: count,
            attendances: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            date: targetDate
        };
    }

    async getReportSummary(query = {}) {
        const targetDate = query.date || toDateOnly(new Date());
        const where = { attendance_date: targetDate };
        if (query.class_id) where.class_id = query.class_id;

        const studentWhere = {};
        const keyword = query.keyword || query.search;
        if (keyword) {
            studentWhere[Op.or] = [
                { full_name: { [Op.like]: `%${keyword}%` } },
                { nis: { [Op.like]: `%${keyword}%` } },
                { rfid_code: { [Op.like]: `%${keyword}%` } }
            ];
        }

        const rows = await StudentDailyAttendance.findAll({
            where,
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'full_name', 'nis'],
                    where: Object.keys(studentWhere).length ? studentWhere : undefined
                },
                { model: Class, as: 'class_info', attributes: ['id', 'name'], required: false }
            ],
            order: [['late_minutes', 'DESC']]
        });

        const total = rows.length;
        const present = rows.filter((item) => item.attendance_status === 'PRESENT').length;
        const late = rows.filter((item) => item.attendance_status === 'LATE').length;
        const alpha = rows.filter((item) => item.attendance_status === 'ALPHA').length;
        const incomplete = rows.filter((item) => item.attendance_status === 'INCOMPLETE').length;

        const lateRanking = rows
            .map((item) => ({
                student_id: item.student_id,
                full_name: item.student ? item.student.full_name : '-',
                nis: item.student ? item.student.nis : '-',
                class_name: item.class_info ? item.class_info.name : '-',
                late_minutes: Number(item.late_minutes || 0),
                attendance_status: item.attendance_status || '-',
                entry_status: item.entry_status || '-'
            }))
            .filter((item) => item.late_minutes > 0 || item.entry_status === 'LATE' || item.attendance_status === 'LATE')
            .sort((a, b) => b.late_minutes - a.late_minutes)
            .slice(0, 10);

        return {
            date: targetDate,
            total_items: total,
            summary: {
                total,
                present,
                late,
                alpha,
                incomplete
            },
            late_ranking: lateRanking
        };
    }

    async getTodayScanLogs(limit = 50) {
        const today = toDateOnly(new Date());
        return StudentAttendanceScanLog.findAll({
            where: literal(`DATE(scanned_at) = '${today}'`),
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'], required: false },
                {
                    model: StudentDailyAttendance,
                    as: 'attendance',
                    attributes: ['id', 'entry_status', 'late_minutes', 'attendance_status'],
                    required: false
                }
            ],
            order: [['id', 'DESC']],
            limit
        });
    }
}

module.exports = new StudentAttendanceQueryService();

