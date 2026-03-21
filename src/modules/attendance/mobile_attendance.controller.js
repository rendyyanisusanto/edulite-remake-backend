'use strict';
const mobileAttendanceService = require('./mobile_attendance.service');

class MobileAttendanceController {
    async getTodayInfo(req, res, next) {
        try {
            const info = await mobileAttendanceService.getTodayInfo(req.user.id);
            res.json({ success: true, message: 'Today attendance info retrieved successfully', data: info });
        } catch (error) {
            next(error);
        }
    }

    async clockIn(req, res, next) {
        try {
            const attendance = await mobileAttendanceService.clockIn(req.user.id, req.body);
            res.json({ success: true, message: 'Clock in successful', data: attendance });
        } catch (error) {
            next(error);
        }
    }

    async clockOut(req, res, next) {
        try {
            const attendance = await mobileAttendanceService.clockOut(req.user.id, req.body);
            res.json({ success: true, message: 'Clock out successful', data: attendance });
        } catch (error) {
            next(error);
        }
    }

    async getMyHistory(req, res, next) {
        try {
            const history = await mobileAttendanceService.getMyHistory(req.user.id, req.query);
            res.json({ success: true, message: 'Attendance history retrieved successfully', data: history });
        } catch (error) {
            next(error);
        }
    }

    async getAttendanceDetail(req, res, next) {
        try {
            const detail = await mobileAttendanceService.getAttendanceDetail(req.user.id, req.params.id);
            res.json({ success: true, message: 'Attendance detail retrieved successfully', data: detail });
        } catch (error) {
            next(error);
        }
    }

    async createRequest(req, res, next) {
        try {
            const request = await mobileAttendanceService.createRequest(req.user.id, req.body);
            res.status(201).json({ success: true, message: 'Attendance request submitted successfully', data: request });
        } catch (error) {
            next(error);
        }
    }

    async getMyRequests(req, res, next) {
        try {
            const requests = await mobileAttendanceService.getMyRequests(req.user.id, req.query);
            res.json({ success: true, message: 'My requests retrieved successfully', data: requests });
        } catch (error) {
            next(error);
        }
    }

    async getRequestDetail(req, res, next) {
        try {
            const detail = await mobileAttendanceService.getRequestDetail(req.user.id, req.params.id);
            res.json({ success: true, message: 'Request detail retrieved successfully', data: detail });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MobileAttendanceController();
