const express = require('express');
const router = express.Router();
const controller = require('./lesson-attendance.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');
const {
    attendanceAccessMiddleware,
    publicReadRateLimit,
    resolveQrLimiter,
    teacherLookupLimiter
} = require('./lesson-attendance.auth');
const {
    setPinSchema,
    updateQrStatusSchema,
    verifyPinSchema,
    submitAttendanceSchema,
    manualCreateSchema,
    correctSessionSchema,
    reasonSchema,
    validateBody
} = require('./lesson-attendance.validator');

// Admin — Teacher PIN Management
router.get(
    '/teachers/:id/attendance-pin/status',
    authMiddleware,
    permissionMiddleware('lesson_attendance.teacher_pin.view'),
    controller.getTeacherPinStatus
);
router.post(
    '/teachers/:id/attendance-pin/generate',
    authMiddleware,
    permissionMiddleware('lesson_attendance.teacher_pin.manage'),
    controller.generateTeacherPin
);
router.put(
    '/teachers/:id/attendance-pin',
    authMiddleware,
    permissionMiddleware('lesson_attendance.teacher_pin.manage'),
    validateBody(setPinSchema),
    controller.setTeacherPin
);
router.delete(
    '/teachers/:id/attendance-pin',
    authMiddleware,
    permissionMiddleware('lesson_attendance.teacher_pin.manage'),
    controller.removeTeacherPin
);

// Admin — Classroom QR Management
router.get(
    '/classes/:id/attendance-qr',
    authMiddleware,
    permissionMiddleware('lesson_attendance.class_qr.view'),
    controller.getClassQr
);
router.post(
    '/classes/:id/attendance-qr/generate',
    authMiddleware,
    permissionMiddleware('lesson_attendance.class_qr.manage'),
    controller.generateClassQr
);
router.post(
    '/classes/:id/attendance-qr/regenerate',
    authMiddleware,
    permissionMiddleware('lesson_attendance.class_qr.manage'),
    controller.regenerateClassQr
);
router.patch(
    '/classes/:id/attendance-qr/status',
    authMiddleware,
    permissionMiddleware('lesson_attendance.class_qr.manage'),
    validateBody(updateQrStatusSchema),
    controller.updateClassQrStatus
);

// Public — Lesson Attendance Foundation
router.get(
    '/public/lesson-attendance/classes/:token',
    publicReadRateLimit(resolveQrLimiter, 'resolve_qr'),
    controller.resolvePublicClassQr
);
router.get(
    '/public/lesson-attendance/classes/:token/teachers',
    publicReadRateLimit(teacherLookupLimiter, 'teacher_lookup'),
    controller.getPublicTeachers
);
router.post(
    '/public/lesson-attendance/classes/:token/verify-pin',
    validateBody(verifyPinSchema),
    controller.verifyTeacherPin
);
router.get(
    '/public/lesson-attendance/context',
    attendanceAccessMiddleware,
    controller.getPublicContext
);
router.post(
    '/public/lesson-attendance/submit',
    attendanceAccessMiddleware,
    validateBody(submitAttendanceSchema),
    controller.submitPublicAttendance
);

// Admin — Lookups & Monitoring (LA-04)
router.get(
    '/lesson-attendance/lookups',
    authMiddleware,
    controller.getLookups
);
router.get(
    '/lesson-attendance/lookups/students',
    authMiddleware,
    permissionMiddleware('lesson_attendance.report.view'),
    controller.getStudentLookup
);
router.get(
    '/lesson-attendance/roster',
    authMiddleware,
    permissionMiddleware('lesson_attendance.data.create'),
    controller.getManualRoster
);
router.get(
    '/lesson-attendance/monitoring',
    authMiddleware,
    permissionMiddleware('lesson_attendance.monitoring.view'),
    controller.getMonitoring
);

// Admin — Transaction Management (LA-04)
router.get(
    '/lesson-attendance/sessions',
    authMiddleware,
    permissionMiddleware('lesson_attendance.data.view'),
    controller.listSessions
);
router.get(
    '/lesson-attendance/sessions/:id',
    authMiddleware,
    permissionMiddleware('lesson_attendance.data.view'),
    controller.getSessionDetail
);
router.post(
    '/lesson-attendance/sessions',
    authMiddleware,
    permissionMiddleware('lesson_attendance.data.create'),
    validateBody(manualCreateSchema),
    controller.createManualAttendance
);
router.patch(
    '/lesson-attendance/sessions/:id/correct',
    authMiddleware,
    permissionMiddleware('lesson_attendance.data.correct'),
    validateBody(correctSessionSchema),
    controller.correctSession
);
router.post(
    '/lesson-attendance/sessions/:id/cancel',
    authMiddleware,
    permissionMiddleware('lesson_attendance.data.cancel'),
    validateBody(reasonSchema),
    controller.cancelSession
);
router.post(
    '/lesson-attendance/sessions/:id/restore',
    authMiddleware,
    permissionMiddleware('lesson_attendance.data.restore'),
    validateBody(reasonSchema),
    controller.restoreSession
);
router.get(
    '/lesson-attendance/sessions/:id/logs',
    authMiddleware,
    permissionMiddleware('lesson_attendance.data.audit'),
    controller.getSessionLogs
);

// Admin — Reports & Export (LA-04)
router.get(
    '/lesson-attendance/reports/class',
    authMiddleware,
    permissionMiddleware('lesson_attendance.report.view'),
    controller.getClassReport
);
router.get(
    '/lesson-attendance/reports/student',
    authMiddleware,
    permissionMiddleware('lesson_attendance.report.view'),
    controller.getStudentReport
);
router.get(
    '/lesson-attendance/reports/student/:studentId/detail',
    authMiddleware,
    permissionMiddleware('lesson_attendance.report.view'),
    controller.getStudentReportDetail
);
router.get(
    '/lesson-attendance/reports/teacher',
    authMiddleware,
    permissionMiddleware('lesson_attendance.report.view'),
    controller.getTeacherReport
);
router.get(
    '/lesson-attendance/reports/subject',
    authMiddleware,
    permissionMiddleware('lesson_attendance.report.view'),
    controller.getSubjectReport
);
router.get(
    '/lesson-attendance/reports/detail',
    authMiddleware,
    permissionMiddleware('lesson_attendance.report.view'),
    controller.getDetailReport
);
router.get(
    '/lesson-attendance/reports/export/excel',
    authMiddleware,
    permissionMiddleware('lesson_attendance.report.export_excel'),
    controller.exportExcel
);
router.get(
    '/lesson-attendance/reports/export/pdf',
    authMiddleware,
    permissionMiddleware('lesson_attendance.report.export_pdf'),
    controller.exportPdf
);

// Admin — Daily Student Attendance Matrix & Truancy Detection (LA-05)
router.get(
    '/lesson-attendance/reports/daily-students',
    authMiddleware,
    permissionMiddleware('lesson_attendance.daily_report.view'),
    controller.getDailyStudentReport
);
router.get(
    '/lesson-attendance/reports/daily-students/export/excel',
    authMiddleware,
    permissionMiddleware('lesson_attendance.daily_report.export_excel'),
    controller.exportDailyStudentExcel
);
router.get(
    '/lesson-attendance/reports/daily-students/export/pdf',
    authMiddleware,
    permissionMiddleware('lesson_attendance.daily_report.export_pdf'),
    controller.exportDailyStudentPdf
);

module.exports = router;
