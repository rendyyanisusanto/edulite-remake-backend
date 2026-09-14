'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('./cbt.controller');

// Need to import authMiddleware and permissionMiddleware correctly based on the common structure.
// I saw them in users.routes.js as:
// const { authMiddleware } = require('../../core/middleware/auth.middleware');
// const { permissionMiddleware } = require('../../core/middleware/permission.middleware');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

const teacherAssignmentRoutes = require('./cbt_master_teacher_assignment.routes');
const studentAccountRoutes = require('./cbt_master_student_account.routes');
const lookupsRoutes = require('./cbt_lookups.routes');
const questionBankRoutes = require('./cbt_question_bank.routes');
const questionRoutes = require('./cbt_question.routes');
const uploadRoutes = require('./cbt_upload.routes');

router.get('/health', authMiddleware, permissionMiddleware('cbt.health.view'), ctrl.getHealth);
router.get('/dashboard/summary', authMiddleware, permissionMiddleware('cbt.dashboard.view'), ctrl.getDashboardSummary);

// Master Data Routes
router.use('/master/teacher-assignments', teacherAssignmentRoutes);
router.use('/master/student-accounts', studentAccountRoutes);
router.use('/lookups', lookupsRoutes);
// Question Bank
router.use('/question-banks', questionBankRoutes);

// Question nested under Question Bank
router.use('/question-banks/:bankId/questions', questionRoutes);

// General Upload inside CBT
router.use('/upload', uploadRoutes);

module.exports = router;
