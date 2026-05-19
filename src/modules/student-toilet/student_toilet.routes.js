'use strict';

const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../../core/middleware/auth.middleware');

const scanController = require('./student_toilet_scan.controller');
const reportController = require('./student_toilet_report.controller');

// Public kiosk endpoint (no auth)
router.post('/student-toilet-permissions/rfid-scan', scanController.rfidScan);
router.get('/student-toilet-permissions/rfid-currently-out', scanController.getCurrentlyOut);

// Admin endpoints
router.get('/student-toilet-permissions/today', authMiddleware, reportController.getToday);
router.get('/student-toilet-permissions', authMiddleware, reportController.getHistory);
router.get('/student-toilet-permissions/summary', authMiddleware, reportController.getSummary);
router.get('/student-toilet-permissions/scan-logs/today', authMiddleware, reportController.getTodayScanLogs);

module.exports = router;

