'use strict';

const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../../core/middleware/auth.middleware');

const scanController = require('./student_attendance_scan.controller');
const shiftController = require('./student_attendance_shift.controller');
const correctionController = require('./student_attendance_correction.controller');

// Public kiosk endpoint (no auth)
router.post('/student-attendances/rfid-scan', scanController.rfidScan);
router.get('/student-attendances/rfid-scan-logs/today', scanController.getTodayScanLogsPublic);

// Monitoring and history
router.get('/student-attendances/today', authMiddleware, scanController.getTodayAttendances);
router.get('/student-attendances', authMiddleware, scanController.getAttendances);
router.get('/student-attendances/report-summary', authMiddleware, scanController.getReportSummary);
router.get('/student-attendances/scan-logs/today', authMiddleware, scanController.getTodayScanLogs);

// Shift master CRUD
router.get('/student-attendance-shifts', authMiddleware, shiftController.listShifts);
router.get('/student-attendance-shifts/:id', authMiddleware, shiftController.getShiftDetail);
router.post('/student-attendance-shifts', authMiddleware, shiftController.createShift);
router.put('/student-attendance-shifts/:id', authMiddleware, shiftController.updateShift);
router.patch('/student-attendance-shifts/:id/toggle', authMiddleware, shiftController.toggleShiftActive);

// Mapping shift per class
router.get('/student-attendance-shift-classes', authMiddleware, shiftController.listClassMappings);
router.post('/student-attendance-shift-classes', authMiddleware, shiftController.upsertClassMapping);
router.put('/student-attendance-shift-classes/:id', authMiddleware, shiftController.updateClassMapping);
router.delete('/student-attendance-shift-classes/:id', authMiddleware, shiftController.deleteClassMapping);

// Override shift per student
router.get('/student-attendance-shift-students', authMiddleware, shiftController.listStudentOverrides);
router.post('/student-attendance-shift-students', authMiddleware, shiftController.upsertStudentOverride);
router.put('/student-attendance-shift-students/:id', authMiddleware, shiftController.updateStudentOverride);
router.delete('/student-attendance-shift-students/:id', authMiddleware, shiftController.deleteStudentOverride);

// Attendance corrections
router.get('/student-attendance-corrections', authMiddleware, correctionController.findAll);
router.get('/student-attendance-corrections/:id', authMiddleware, correctionController.findById);
router.post('/student-attendance-corrections', authMiddleware, correctionController.create);
router.put('/student-attendance-corrections/:id', authMiddleware, correctionController.update);
router.patch('/student-attendance-corrections/:id/review', authMiddleware, correctionController.review);

module.exports = router;

