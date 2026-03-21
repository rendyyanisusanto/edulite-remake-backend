'use strict';
const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

const shiftCtrl = require('./attendance_shift.controller');
const settingCtrl = require('./attendance_setting.controller');
const monitorCtrl = require('./attendance_monitoring.controller');
const historyCtrl = require('./attendance_history.controller');
const reportCtrl = require('./attendance_report.controller');
const requestCtrl = require('./attendance_request.controller');

// ── Shifts ───────────────────────────────────────────────────────────────────
router.get('/shifts/active', authMiddleware, shiftCtrl.findAllActive);
router.get('/shifts', authMiddleware, permissionMiddleware('attendance.shift.view'), shiftCtrl.findAll);
router.get('/shifts/:id', authMiddleware, permissionMiddleware('attendance.shift.view'), shiftCtrl.findById);
router.post('/shifts', authMiddleware, permissionMiddleware('attendance.shift.create'), shiftCtrl.create);
router.put('/shifts/:id', authMiddleware, permissionMiddleware('attendance.shift.update'), shiftCtrl.update);
router.patch('/shifts/:id/toggle', authMiddleware, permissionMiddleware('attendance.shift.update'), shiftCtrl.toggleActive);
router.delete('/shifts/:id', authMiddleware, permissionMiddleware('attendance.shift.delete'), shiftCtrl.delete);

// ── Settings ─────────────────────────────────────────────────────────────────
router.get('/settings', authMiddleware, permissionMiddleware('attendance.setting.view'), settingCtrl.getCurrent);
router.post('/settings', authMiddleware, permissionMiddleware('attendance.setting.update'), settingCtrl.upsert);

// ── Monitoring ───────────────────────────────────────────────────────────────
router.get('/monitoring/summary', authMiddleware, permissionMiddleware('attendance.monitor.view'), monitorCtrl.getSummaryByDate);
router.get('/monitoring', authMiddleware, permissionMiddleware('attendance.monitor.view'), monitorCtrl.findByDate);
router.get('/monitoring/:id', authMiddleware, permissionMiddleware('attendance.monitor.view'), monitorCtrl.findById);

// ── History ──────────────────────────────────────────────────────────────────
router.get('/history', authMiddleware, permissionMiddleware('attendance.history.view'), historyCtrl.findAll);
router.get('/history/:id', authMiddleware, permissionMiddleware('attendance.history.view'), historyCtrl.findById);

// ── Reports ──────────────────────────────────────────────────────────────────
router.get('/reports/export/excel', authMiddleware, permissionMiddleware('attendance.report.export'), reportCtrl.exportExcel);
router.get('/reports', authMiddleware, permissionMiddleware('attendance.report.view'), reportCtrl.getSummary);

// ── Requests ─────────────────────────────────────────────────────────────────
router.get('/requests', authMiddleware, permissionMiddleware('attendance.request.view'), requestCtrl.findAll);
router.get('/requests/:id', authMiddleware, permissionMiddleware('attendance.request.view'), requestCtrl.findById);
router.patch('/requests/:id/approve', authMiddleware, permissionMiddleware('attendance.request.approve'), requestCtrl.approve);
router.patch('/requests/:id/reject', authMiddleware, permissionMiddleware('attendance.request.reject'), requestCtrl.reject);

const mobileCtrl = require('./mobile_attendance.controller');

// ── Mobile App Endpoints ─────────────────────────────────────────────────────
// Note: We reuse permissionMiddleware but some actions like clockin might be derived from implicit roles,
// but for now we expect users have base access or we bypass specific role checks inside if they are self-service.
// Wait, the PRD says to not break anything. The mobile users just need to be authenticated.
router.get('/mobile/today', authMiddleware, mobileCtrl.getTodayInfo);
router.post('/mobile/clock-in', authMiddleware, mobileCtrl.clockIn);
router.post('/mobile/clock-out', authMiddleware, mobileCtrl.clockOut);
router.get('/mobile/history', authMiddleware, mobileCtrl.getMyHistory);
router.get('/mobile/history/:id', authMiddleware, mobileCtrl.getAttendanceDetail);
router.get('/mobile/requests', authMiddleware, mobileCtrl.getMyRequests);
router.post('/mobile/requests', authMiddleware, mobileCtrl.createRequest);
router.get('/mobile/requests/:id', authMiddleware, mobileCtrl.getRequestDetail);

module.exports = router;
