'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctrl = require('./mobile.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');

const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

// Use memoryStorage for MinIO uploading (max 5 MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(authMiddleware);

// Students
router.get('/students/search', ctrl.searchStudents);
router.get('/student-item-deposits/my-items', ctrl.getMyStudentItemDeposits);
router.get('/student-item-deposits/my-loans', ctrl.getMyStudentItemLoans);
router.get('/student-item-deposits/active-items', ctrl.getActiveStudentItemDeposits);

// Violations
router.post('/student-violations', permissionMiddleware('violation.report.create'), upload.single('photo'), ctrl.submitViolation);
router.get('/student-violations/my', permissionMiddleware('violation.report.view_own'), ctrl.getMyViolations);
router.get('/student-violations/:id', permissionMiddleware('violation.report.view_own'), ctrl.getViolationDetail);

// Positive Points
router.post('/student-positive-points', permissionMiddleware('positive_point.report.create'), upload.single('photo'), ctrl.submitPositivePoint);
router.get('/student-positive-points/my', permissionMiddleware('positive_point.report.view_own'), ctrl.getMyPositivePoints);
router.get('/student-positive-points/:id', permissionMiddleware('positive_point.report.view_own'), ctrl.getPositivePointDetail);

module.exports = router;
