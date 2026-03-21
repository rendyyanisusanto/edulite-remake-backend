'use strict';
const { UserAttendance, AttendanceShift, AttendanceSetting, AttendanceRequest, AttendanceRequestLog } = require('../../models');
const { Op } = require('sequelize');

class MobileAttendanceService {
    getTodayDate() {
        return new Date().toISOString().slice(0, 10);
    }

    async getTodayInfo(userId) {
        const today = this.getTodayDate();
        
        // Get active setting
        const setting = await AttendanceSetting.findOne({ where: { is_active: true } });
        
        // Get active shift
        let shift = null;
        if (setting && setting.active_shift_id) {
            shift = await AttendanceShift.findByPk(setting.active_shift_id);
        } else {
            // Fallback to first active shift if setting is missing active_shift_id
            shift = await AttendanceShift.findOne({ where: { is_active: true } });
        }

        // Get today's attendance record
        const attendance = await UserAttendance.findOne({
            where: { user_id: userId, attendance_date: today }
        });

        return {
            today,
            setting,
            shift,
            attendance
        };
    }

    async clockIn(userId, payload) {
        const today = this.getTodayDate();
        
        let attendance = await UserAttendance.findOne({
            where: { user_id: userId, attendance_date: today }
        });

        if (attendance && attendance.clock_in_at) {
            throw new Error('You have already clocked in today.');
        }

        const data = {
            user_id: userId,
            attendance_date: today,
            clock_in_at: new Date(),
            clock_in_lat: payload.latitude,
            clock_in_lng: payload.longitude,
            clock_in_accuracy: payload.accuracy,
            clock_in_distance_meters: payload.distance_meters,
            clock_in_status: payload.status || 'ON_SITE', // ON_SITE, OUTSIDE_RADIUS, GPS_LOW_ACCURACY
            clock_in_method: 'MOBILE',
            clock_in_note: payload.note,
            attendance_status: 'PRESENT' // initial status
        };

        if (attendance) {
            await attendance.update(data);
        } else {
            attendance = await UserAttendance.create(data);
        }

        return attendance;
    }

    async clockOut(userId, payload) {
        const today = this.getTodayDate();
        
        const attendance = await UserAttendance.findOne({
            where: { user_id: userId, attendance_date: today }
        });

        if (!attendance || !attendance.clock_in_at) {
            throw new Error('You must clock in first before clocking out.');
        }

        if (attendance.clock_out_at) {
            throw new Error('You have already clocked out today.');
        }

        const clockOutTime = new Date();
        const diffMs = clockOutTime - new Date(attendance.clock_in_at);
        const workDurationMinutes = Math.max(0, Math.floor(diffMs / 60000));

        await attendance.update({
            clock_out_at: clockOutTime,
            clock_out_lat: payload.latitude,
            clock_out_lng: payload.longitude,
            clock_out_accuracy: payload.accuracy,
            clock_out_distance_meters: payload.distance_meters,
            clock_out_status: payload.status || 'ON_SITE',
            clock_out_method: 'MOBILE',
            clock_out_note: payload.note,
            work_duration_minutes: workDurationMinutes
        });

        return attendance;
    }

    async getMyHistory(userId, query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const offset = (page - 1) * limit;

        const where = { user_id: userId };
        
        // Allow month filtering e.g. YYYY-MM
        if (query.month) {
            const startDate = `${query.month}-01`;
            const endDate = `${query.month}-31`; // Simplified, works for string comparison
            where.attendance_date = { [Op.between]: [startDate, endDate] };
        }

        const { count, rows } = await UserAttendance.findAndCountAll({
            where,
            limit,
            offset,
            order: [['attendance_date', 'DESC']],
            include: [
                { model: AttendanceShift, as: 'shift', attributes: ['id', 'name', 'clock_in_start', 'clock_out_end'] }
            ]
        });

        return { totalItems: count, attendances: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    async getAttendanceDetail(userId, id) {
        const record = await UserAttendance.findOne({
            where: { id, user_id: userId },
            include: [{ model: AttendanceShift, as: 'shift' }]
        });
        if (!record) throw new Error('Attendance not found');
        return record;
    }

    async createRequest(userId, payload) {
        const data = {
            user_id: userId,
            attendance_date: payload.attendance_date,
            request_type: payload.request_type,
            request_status: 'PENDING',
            requested_clock_in_at: payload.requested_clock_in_at || null,
            requested_clock_out_at: payload.requested_clock_out_at || null,
            requested_clock_in_note: payload.requested_clock_in_note || null,
            requested_clock_out_note: payload.requested_clock_out_note || null,
            reason: payload.reason,
            attachment_url: payload.attachment_url || null
        };

        // If there's an existing attendance record for this date, link it
        const existingAtt = await UserAttendance.findOne({
            where: { user_id: userId, attendance_date: payload.attendance_date }
        });
        if (existingAtt) {
            data.attendance_id = existingAtt.id;
        }

        const req = await AttendanceRequest.create(data);
        
        // Log submission
        await AttendanceRequestLog.create({
            attendance_request_id: req.id,
            action: 'SUBMITTED',
            action_by: userId
        });

        return req;
    }

    async getMyRequests(userId, query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const offset = (page - 1) * limit;

        const where = { user_id: userId };
        if (query.request_status) where.request_status = query.request_status;

        const { count, rows } = await AttendanceRequest.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return { totalItems: count, requests: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    async getRequestDetail(userId, id) {
        const req = await AttendanceRequest.findOne({
            where: { id, user_id: userId },
            include: [
                { model: UserAttendance, as: 'attendance' },
                { model: AttendanceRequestLog, as: 'logs' }
            ]
        });
        if (!req) throw new Error('Request not found');
        return req;
    }
}

module.exports = new MobileAttendanceService();
