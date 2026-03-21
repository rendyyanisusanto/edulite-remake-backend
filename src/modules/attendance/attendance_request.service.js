'use strict';
const { AttendanceRequest, AttendanceRequestLog, UserAttendance, User } = require('../../models');
const { Op } = require('sequelize');
const sequelize = require('../../models').sequelize;

class AttendanceRequestService {
    async findAll(query = {}) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 15;
        const offset = (page - 1) * limit;

        const where = {};
        if (query.request_status) where.request_status = query.request_status;
        if (query.request_type) where.request_type = query.request_type;
        if (query.user_id) where.user_id = query.user_id;
        if (query.date_from || query.date_to) {
            where.attendance_date = {};
            if (query.date_from) where.attendance_date[Op.gte] = query.date_from;
            if (query.date_to) where.attendance_date[Op.lte] = query.date_to;
        }

        const userWhere = {};
        if (query.search) userWhere.name = { [Op.like]: `%${query.search}%` };

        const { count, rows } = await AttendanceRequest.findAndCountAll({
            where,
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'email'], where: Object.keys(userWhere).length ? userWhere : undefined },
                { model: User, as: 'reviewer', attributes: ['id', 'name'], required: false },
                { model: UserAttendance, as: 'attendance', required: false }
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return { totalItems: count, requests: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    async findById(id) {
        const item = await AttendanceRequest.findByPk(id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'reviewer', attributes: ['id', 'name'], required: false },
                { model: UserAttendance, as: 'attendance', required: false },
                { model: AttendanceRequestLog, as: 'logs', include: [{ model: User, as: 'actor', attributes: ['id', 'name'] }] }
            ]
        });
        if (!item) throw new Error('Attendance request not found');
        return item;
    }

    async approve(id, reviewerId, reviewNote) {
        return await sequelize.transaction(async (t) => {
            const request = await AttendanceRequest.findByPk(id, { transaction: t });
            if (!request) throw new Error('Attendance request not found');
            if (request.request_status !== 'PENDING') throw new Error('Request is not pending');

            // Update request status
            await request.update({
                request_status: 'APPROVED',
                reviewed_by: reviewerId,
                reviewed_at: new Date(),
                review_note: reviewNote || null
            }, { transaction: t });

            // Apply to attendance record
            const attendancePayload = {};
            if (['CLOCK_IN', 'BOTH'].includes(request.request_type)) {
                attendancePayload.clock_in_at = request.requested_clock_in_at;
                attendancePayload.clock_in_status = 'MANUAL_APPROVED';
                attendancePayload.clock_in_method = 'MANUAL';
                attendancePayload.clock_in_note = request.requested_clock_in_note;
            }
            if (['CLOCK_OUT', 'BOTH'].includes(request.request_type)) {
                attendancePayload.clock_out_at = request.requested_clock_out_at;
                attendancePayload.clock_out_status = 'MANUAL_APPROVED';
                attendancePayload.clock_out_method = 'MANUAL';
                attendancePayload.clock_out_note = request.requested_clock_out_note;
            }

            // Calculate work duration if both times available
            if (attendancePayload.clock_in_at && attendancePayload.clock_out_at) {
                const diff = new Date(attendancePayload.clock_out_at) - new Date(attendancePayload.clock_in_at);
                attendancePayload.work_duration_minutes = Math.max(0, Math.floor(diff / 60000));
            }

            if (request.attendance_id) {
                await UserAttendance.update(attendancePayload, {
                    where: { id: request.attendance_id },
                    transaction: t
                });
            } else {
                const newAttendance = await UserAttendance.create({
                    user_id: request.user_id,
                    attendance_date: request.attendance_date,
                    attendance_status: 'PRESENT',
                    ...attendancePayload
                }, { transaction: t });
                await request.update({ attendance_id: newAttendance.id }, { transaction: t });
            }

            // Audit log
            await AttendanceRequestLog.create({
                attendance_request_id: id,
                action: 'APPROVED',
                action_by: reviewerId,
                action_note: reviewNote || null
            }, { transaction: t });

            return await AttendanceRequest.findByPk(id, { transaction: t });
        });
    }

    async reject(id, reviewerId, reviewNote) {
        return await sequelize.transaction(async (t) => {
            const request = await AttendanceRequest.findByPk(id, { transaction: t });
            if (!request) throw new Error('Attendance request not found');
            if (request.request_status !== 'PENDING') throw new Error('Request is not pending');

            await request.update({
                request_status: 'REJECTED',
                reviewed_by: reviewerId,
                reviewed_at: new Date(),
                review_note: reviewNote || null
            }, { transaction: t });

            await AttendanceRequestLog.create({
                attendance_request_id: id,
                action: 'REJECTED',
                action_by: reviewerId,
                action_note: reviewNote || null
            }, { transaction: t });

            return await AttendanceRequest.findByPk(id, { transaction: t });
        });
    }
}

module.exports = new AttendanceRequestService();
