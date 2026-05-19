'use strict';

const express = require('express');
const router = express.Router();

const ctrl = require('./report.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);
router.use(permissionMiddleware('extracurricular.report.view'));

router.get('/members', ctrl.getMembersReport);
router.get('/student-attendance', ctrl.getStudentAttendanceReport);
router.get('/coach-attendance', ctrl.getCoachAttendanceReport);
router.get('/student-progress', ctrl.getStudentProgressReport);
router.get('/sessions', ctrl.getSessionsReport);
router.get('/ranking', ctrl.getRankingReport);
router.get('/dashboard', ctrl.getDashboardReport);

router.get('/members/export/excel', permissionMiddleware('extracurricular.report.export'), ctrl.exportMembersExcel);
router.get('/student-attendance/export/excel', permissionMiddleware('extracurricular.report.export'), ctrl.exportStudentAttendanceExcel);
router.get('/coach-attendance/export/excel', permissionMiddleware('extracurricular.report.export'), ctrl.exportCoachAttendanceExcel);
router.get('/student-progress/export/excel', permissionMiddleware('extracurricular.report.export'), ctrl.exportStudentProgressExcel);
router.get('/sessions/export/excel', permissionMiddleware('extracurricular.report.export'), ctrl.exportSessionsExcel);
router.get('/ranking/export/excel', permissionMiddleware('extracurricular.report.export'), ctrl.exportRankingExcel);
router.get('/dashboard/export/excel', permissionMiddleware('extracurricular.report.export'), ctrl.exportDashboardExcel);

router.get('/members/export/pdf', permissionMiddleware('extracurricular.report.export'), ctrl.exportMembersPdf);
router.get('/student-attendance/export/pdf', permissionMiddleware('extracurricular.report.export'), ctrl.exportStudentAttendancePdf);
router.get('/coach-attendance/export/pdf', permissionMiddleware('extracurricular.report.export'), ctrl.exportCoachAttendancePdf);
router.get('/student-progress/export/pdf', permissionMiddleware('extracurricular.report.export'), ctrl.exportStudentProgressPdf);
router.get('/sessions/export/pdf', permissionMiddleware('extracurricular.report.export'), ctrl.exportSessionsPdf);
router.get('/ranking/export/pdf', permissionMiddleware('extracurricular.report.export'), ctrl.exportRankingPdf);
router.get('/dashboard/export/pdf', permissionMiddleware('extracurricular.report.export'), ctrl.exportDashboardPdf);

module.exports = router;
