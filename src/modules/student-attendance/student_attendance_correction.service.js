'use strict';

const { Op } = require('sequelize');
const db = require('../../models');
const {
    StudentAttendanceCorrection,
    StudentDailyAttendance,
    Student,
    Class,
    User
} = db;
const { ensure, validateCorrectionPayload } = require('./student_attendance.validator');

class StudentAttendanceCorrectionService {
    async findAll(query = {}) {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        const offset = (page - 1) * limit;

        const where = {};
        if (query.status) where.status = query.status;
        if (query.student_id) where.student_id = query.student_id;

        const studentWhere = {};
        if (query.keyword) {
            studentWhere[Op.or] = [
                { full_name: { [Op.like]: `%${query.keyword}%` } },
                { nis: { [Op.like]: `%${query.keyword}%` } }
            ];
        }

        const { count, rows } = await StudentAttendanceCorrection.findAndCountAll({
            where,
            include: [
                {
                    model: StudentDailyAttendance,
                    as: 'attendance',
                    include: [{ model: Class, as: 'class_info', attributes: ['id', 'name'], required: false }]
                },
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'], where: Object.keys(studentWhere).length ? studentWhere : undefined },
                { model: User, as: 'reviewer', attributes: ['id', 'name'], required: false }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
            distinct: true
        });

        return {
            totalItems: count,
            corrections: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const item = await StudentAttendanceCorrection.findByPk(id, {
            include: [
                {
                    model: StudentDailyAttendance,
                    as: 'attendance',
                    include: [{ model: Class, as: 'class_info', attributes: ['id', 'name'], required: false }]
                },
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                { model: User, as: 'reviewer', attributes: ['id', 'name'], required: false }
            ]
        });
        ensure(item, 'Pengajuan koreksi tidak ditemukan', 'NOT_FOUND', 404);
        return item;
    }

    async create(payload = {}) {
        validateCorrectionPayload(payload, false);

        const attendance = await StudentDailyAttendance.findByPk(payload.student_attendance_id);
        ensure(attendance, 'Data presensi harian tidak ditemukan', 'NOT_FOUND', 404);

        const created = await StudentAttendanceCorrection.create({
            student_attendance_id: payload.student_attendance_id,
            student_id: payload.student_id,
            request_type: payload.request_type,
            requested_clock_in_at: payload.requested_clock_in_at || null,
            requested_clock_out_at: payload.requested_clock_out_at || null,
            reason: payload.reason,
            attachment_file: payload.attachment_file || null,
            status: 'PENDING'
        });

        return this.findById(created.id);
    }

    async update(id, payload = {}) {
        validateCorrectionPayload(payload, true);
        const item = await StudentAttendanceCorrection.findByPk(id);
        ensure(item, 'Pengajuan koreksi tidak ditemukan', 'NOT_FOUND', 404);
        ensure(item.status === 'PENDING', 'Hanya koreksi status PENDING yang dapat diubah', 'BUSINESS_RULE_ERROR', 422);

        await item.update({
            request_type: Object.prototype.hasOwnProperty.call(payload, 'request_type') ? payload.request_type : item.request_type,
            requested_clock_in_at: Object.prototype.hasOwnProperty.call(payload, 'requested_clock_in_at') ? (payload.requested_clock_in_at || null) : item.requested_clock_in_at,
            requested_clock_out_at: Object.prototype.hasOwnProperty.call(payload, 'requested_clock_out_at') ? (payload.requested_clock_out_at || null) : item.requested_clock_out_at,
            reason: Object.prototype.hasOwnProperty.call(payload, 'reason') ? payload.reason : item.reason,
            attachment_file: Object.prototype.hasOwnProperty.call(payload, 'attachment_file') ? (payload.attachment_file || null) : item.attachment_file
        });

        return this.findById(id);
    }

    async review(id, payload = {}, reviewer = {}) {
        const item = await StudentAttendanceCorrection.findByPk(id);
        ensure(item, 'Pengajuan koreksi tidak ditemukan', 'NOT_FOUND', 404);
        ensure(item.status === 'PENDING', 'Koreksi sudah direview', 'BUSINESS_RULE_ERROR', 422);
        ensure(payload.status === 'APPROVED' || payload.status === 'REJECTED', 'status review tidak valid');

        return db.sequelize.transaction(async (transaction) => {
            await item.update(
                {
                    status: payload.status,
                    reviewed_by: reviewer.id || null,
                    reviewed_at: new Date(),
                    review_note: payload.review_note || null
                },
                { transaction }
            );

            if (payload.status === 'APPROVED') {
                const attendance = await StudentDailyAttendance.findByPk(item.student_attendance_id, { transaction });
                if (attendance) {
                    const nextPayload = {};
                    if (item.requested_clock_in_at) {
                        nextPayload.clock_in_at = item.requested_clock_in_at;
                        nextPayload.clock_in_method = 'MANUAL';
                    }
                    if (item.requested_clock_out_at) {
                        nextPayload.clock_out_at = item.requested_clock_out_at;
                        nextPayload.clock_out_method = 'MANUAL';
                    }
                    await attendance.update(nextPayload, { transaction });
                }
            }

            return this.findById(id);
        });
    }
}

module.exports = new StudentAttendanceCorrectionService();

