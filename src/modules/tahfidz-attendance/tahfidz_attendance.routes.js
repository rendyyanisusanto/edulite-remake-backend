'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const tahfidzAttendanceController = require('./tahfidz_attendance.controller');
const multer = require('multer');

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
        }
    }
});

// ============================================
// Tahfidz Attendance API Routes
// ============================================

// Get classes for selection
router.get('/v1/tahfidz-attendance/classes', authMiddleware, tahfidzAttendanceController.getClasses);

// Get attendance for a specific class and date (for the input form)
router.get('/v1/tahfidz-attendance/class', authMiddleware, tahfidzAttendanceController.getAttendanceByClass);

// Bulk upsert attendance
router.post('/v1/tahfidz-attendance/bulk-upsert', authMiddleware, tahfidzAttendanceController.bulkUpsertAttendance);

// Get recap (general)
router.get('/v1/tahfidz-attendance/recap', authMiddleware, tahfidzAttendanceController.getRecap);

// Get student recap
router.get('/v1/tahfidz-attendance/recap/student/:id', authMiddleware, tahfidzAttendanceController.getStudentRecap);

// Download Template
router.get('/v1/tahfidz-attendance/template', authMiddleware, tahfidzAttendanceController.downloadTemplate);

// Import Attendance
router.post('/v1/tahfidz-attendance/import', authMiddleware, upload.single('file'), tahfidzAttendanceController.importAttendance);

module.exports = router;
