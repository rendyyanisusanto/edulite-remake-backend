'use strict';

const scanService = require('./student_attendance_scan.service');
const queryService = require('./student_attendance_query.service');
const { validateRfidScanPayload } = require('./student_attendance.validator');

exports.rfidScan = async (req, res, next) => {
    try {
        validateRfidScanPayload(req.body);

        if (req.body.kiosk_token !== process.env.RFID_GATE_KIOSK_TOKEN) {
            return res.status(401).json({ success: false, message: 'Unauthorized kiosk token', code: 'UNAUTHORIZED' });
        }

        const result = await scanService.scan(req.body);
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getTodayAttendances = async (req, res, next) => {
    try {
        res.json({ success: true, data: await queryService.findToday(req.query) });
    } catch (error) {
        next(error);
    }
};

exports.getAttendances = async (req, res, next) => {
    try {
        res.json({ success: true, data: await queryService.findAll(req.query) });
    } catch (error) {
        next(error);
    }
};

exports.getReportSummary = async (req, res, next) => {
    try {
        res.json({ success: true, data: await queryService.getReportSummary(req.query) });
    } catch (error) {
        next(error);
    }
};

exports.getTodayScanLogs = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 50;
        res.json({ success: true, data: await queryService.getTodayScanLogs(limit) });
    } catch (error) {
        next(error);
    }
};

exports.getTodayScanLogsPublic = async (req, res, next) => {
    try {
        const kioskToken = String(req.query.kiosk_token || '').trim();
        if (!kioskToken || kioskToken !== process.env.RFID_GATE_KIOSK_TOKEN) {
            return res.status(401).json({ success: false, message: 'Unauthorized kiosk token', code: 'UNAUTHORIZED' });
        }

        const limit = parseInt(req.query.limit, 10) || 30;
        const logs = await queryService.getTodayScanLogs(limit);
        const totalScans = Array.isArray(logs) ? logs.length : 0;
        const totalSuccess = Array.isArray(logs) ? logs.filter((item) => item.result_status === 'SUCCESS').length : 0;

        return res.json({
            success: true,
            data: {
                logs,
                total_scans: totalScans,
                total_success: totalSuccess
            }
        });
    } catch (error) {
        next(error);
    }
};

