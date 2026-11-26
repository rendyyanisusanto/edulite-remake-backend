const pinService = require('./lesson-attendance-pin.service');
const qrService = require('./lesson-attendance-qr.service');
const lessonAttendanceService = require('./lesson-attendance.service');
const adminService = require('./lesson-attendance-admin.service');
const reportService = require('./lesson-attendance-report.service');
const exportService = require('./lesson-attendance-export.service');
const dailyReportService = require('./lesson-attendance-daily-report.service');
const dailyExportService = require('./lesson-attendance-daily-export.service');
const integratedReportService = require('./lesson-attendance-integrated-report.service');
const integratedExportService = require('./lesson-attendance-integrated-export.service');
const crypto = require('crypto');
const { getClientIp } = require('./lesson-attendance.auth');

function getRequestId(req) {
    return String(req.headers['x-request-id'] || req.id || crypto.randomUUID()).slice(0, 64);
}
const { AppError } = require('./lesson-attendance.constants');
const logger = require('../../core/logger');

function handleControllerError(res, next, error, context) {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            error_code: error.errorCode
        });
    }
    logger.error(error.message, {
        module: 'lesson-attendance',
        operation: context.operation,
        actor_id: context.actorId || null,
        teacher_id: context.teacherId || null,
        class_id: context.classId || null,
        stack: error.stack
    });
    return next(error);
}

class LessonAttendanceController {
    async getTeacherPinStatus(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const data = await pinService.getPinStatus(req.params.id);
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'getTeacherPinStatus',
                actorId: req.user?.id,
                teacherId: req.params.id
            });
        }
    }

    async generateTeacherPin(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const data = await pinService.generatePin(req.params.id, req.user?.id, getClientIp(req));
            res.json({
                success: true,
                message: 'PIN presensi berhasil dibuat.',
                data
            });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'generateTeacherPin',
                actorId: req.user?.id,
                teacherId: req.params.id
            });
        }
    }

    async setTeacherPin(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const data = await pinService.setManualPin(req.params.id, req.body.pin, req.user?.id, getClientIp(req));
            res.json({
                success: true,
                message: 'PIN presensi berhasil disimpan.',
                data
            });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'setTeacherPin',
                actorId: req.user?.id,
                teacherId: req.params.id
            });
        }
    }

    async removeTeacherPin(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const data = await pinService.removePin(req.params.id, req.user?.id, getClientIp(req));
            res.json({
                success: true,
                message: 'PIN presensi guru berhasil dihapus.',
                data
            });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'removeTeacherPin',
                actorId: req.user?.id,
                teacherId: req.params.id
            });
        }
    }

    async getClassQr(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const data = await qrService.getClassQrStatus(req.params.id);
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'getClassQr',
                actorId: req.user?.id,
                classId: req.params.id
            });
        }
    }

    async generateClassQr(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const data = await qrService.generateClassQr(req.params.id, req.user?.id, getClientIp(req));
            res.status(201).json({
                success: true,
                message: 'QR Code presensi kelas berhasil dibuat.',
                data
            });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'generateClassQr',
                actorId: req.user?.id,
                classId: req.params.id
            });
        }
    }

    async regenerateClassQr(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const data = await qrService.regenerateClassQr(req.params.id, req.user?.id, getClientIp(req));
            res.json({
                success: true,
                message: 'QR Code presensi kelas berhasil digenerate ulang.',
                data
            });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'regenerateClassQr',
                actorId: req.user?.id,
                classId: req.params.id
            });
        }
    }

    async updateClassQrStatus(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const data = await qrService.updateClassQrStatus(
                req.params.id,
                req.body.is_active,
                req.user?.id,
                getClientIp(req)
            );
            res.json({
                success: true,
                message: data.is_active
                    ? 'QR Code presensi kelas berhasil diaktifkan.'
                    : 'QR Code presensi kelas berhasil dinonaktifkan.',
                data
            });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'updateClassQrStatus',
                actorId: req.user?.id,
                classId: req.params.id
            });
        }
    }

    async resolvePublicClassQr(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const data = await lessonAttendanceService.resolvePublicQr(req.params.token);
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'resolvePublicClassQr' });
        }
    }

    async getPublicTeachers(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const teachers = await lessonAttendanceService.getPublicTeachersByQr(req.params.token);
            res.json({ success: true, data: teachers });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getPublicTeachers' });
        }
    }

    async verifyTeacherPin(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const data = await lessonAttendanceService.verifyTeacherPinByQr(
                req.params.token,
                req.body.teacher_id,
                req.body.pin,
                getClientIp(req)
            );
            res.json({
                success: true,
                message: 'Verifikasi PIN berhasil.',
                data
            });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'verifyTeacherPin',
                teacherId: req.body?.teacher_id
            });
        }
    }

    async getPublicContext(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const data = await lessonAttendanceService.getContext(req.attendanceAuth);
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'getPublicContext',
                teacherId: req.attendanceAuth?.teacher?.id,
                classId: req.attendanceAuth?.classInfo?.id
            });
        }
    }

    async submitPublicAttendance(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const data = await lessonAttendanceService.submitPublicAttendance({
                attendanceAuth: req.attendanceAuth,
                subjectId: req.body.subject_id,
                lessonPeriodIds: req.body.lesson_period_ids,
                students: req.body.students,
                notes: req.body.notes,
                ipAddress: getClientIp(req)
            });
            res.status(201).json({
                success: true,
                message: 'Presensi jam pelajaran berhasil disimpan.',
                data
            });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'submitPublicAttendance',
                teacherId: req.attendanceAuth?.teacher?.id,
                classId: req.attendanceAuth?.classInfo?.id
            });
        }
    }

    // ==================== LA-04 Admin Endpoints ====================

    async getLookups(req, res, next) {
        try {
            const data = await adminService.getLookups({
                academicYearId: req.query.academic_year_id,
                gradeId: req.query.grade_id,
                departmentId: req.query.department_id
            });
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getLookups', actorId: req.user?.id });
        }
    }

    async getStudentLookup(req, res, next) {
        try {
            const data = await adminService.getStudentLookup({
                search: req.query.search,
                academicYearId: req.query.academic_year_id,
                limit: req.query.limit
            });
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getStudentLookup', actorId: req.user?.id });
        }
    }

    async getManualRoster(req, res, next) {
        try {
            const data = await adminService.getManualRoster({
                academicYearId: req.query.academic_year_id,
                classId: req.query.class_id,
                attendanceDate: req.query.attendance_date
            });
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'getManualRoster',
                actorId: req.user?.id,
                classId: req.query?.class_id
            });
        }
    }

    async getMonitoring(req, res, next) {
        try {
            const data = await adminService.getMonitoring({
                attendanceDate: req.query.attendance_date,
                academicYearId: req.query.academic_year_id,
                gradeId: req.query.grade_id,
                departmentId: req.query.department_id,
                classId: req.query.class_id,
                status: req.query.status,
                search: req.query.search
            });
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getMonitoring', actorId: req.user?.id });
        }
    }

    async exportMonitoringPdf(req, res, next) {
        try {
            const { buffer, filename } = await exportService.generateMonitoringPdf(req.query);
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            res.end(buffer);
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'exportMonitoringPdf', actorId: req.user?.id });
        }
    }

    async listSessions(req, res, next) {
        try {
            const result = await adminService.listSessions(req.query);
            res.json({
                success: true,
                data: result.rows,
                pagination: result.pagination
            });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'listSessions', actorId: req.user?.id });
        }
    }

    async getSessionDetail(req, res, next) {
        try {
            const data = await adminService.getSessionDetail(req.params.id, {
                search: req.query.search,
                status: req.query.status
            });
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getSessionDetail', actorId: req.user?.id });
        }
    }

    async createManualAttendance(req, res, next) {
        try {
            const data = await adminService.createManualAttendance({
                academicYearId: req.body.academic_year_id,
                classId: req.body.class_id,
                teacherId: req.body.teacher_id,
                subjectId: req.body.subject_id,
                attendanceDate: req.body.attendance_date,
                lessonPeriodIds: req.body.lesson_period_ids,
                students: req.body.students,
                notes: req.body.notes,
                actorUserId: req.user.id,
                ipAddress: getClientIp(req)
            });
            res.status(201).json({
                success: true,
                message: 'Presensi manual berhasil disimpan.',
                data
            });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'createManualAttendance',
                actorId: req.user?.id,
                teacherId: req.body?.teacher_id,
                classId: req.body?.class_id
            });
        }
    }

    async correctSession(req, res, next) {
        try {
            const data = await adminService.correctSession({
                sessionId: req.params.id,
                teacherId: req.body.teacher_id,
                subjectId: req.body.subject_id,
                notes: req.body.notes,
                students: req.body.students,
                reason: req.body.reason,
                expectedUpdatedAt: req.body.expected_updated_at,
                actorUserId: req.user.id,
                ipAddress: getClientIp(req)
            });
            res.json({
                success: true,
                message: 'Koreksi presensi berhasil disimpan.',
                data
            });
        } catch (error) {
            handleControllerError(res, next, error, {
                operation: 'correctSession',
                actorId: req.user?.id,
                teacherId: req.body?.teacher_id
            });
        }
    }

    async cancelSession(req, res, next) {
        try {
            const data = await adminService.cancelSession({
                sessionId: req.params.id,
                reason: req.body.reason,
                actorUserId: req.user.id,
                ipAddress: getClientIp(req)
            });
            res.json({
                success: true,
                message: 'Transaksi presensi berhasil dibatalkan.',
                data
            });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'cancelSession', actorId: req.user?.id });
        }
    }

    async restoreSession(req, res, next) {
        try {
            const data = await adminService.restoreSession({
                sessionId: req.params.id,
                reason: req.body.reason,
                actorUserId: req.user.id,
                ipAddress: getClientIp(req)
            });
            res.json({
                success: true,
                message: 'Transaksi presensi berhasil dipulihkan.',
                data
            });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'restoreSession', actorId: req.user?.id });
        }
    }

    async getSessionLogs(req, res, next) {
        try {
            const data = await adminService.getSessionLogs(req.params.id);
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getSessionLogs', actorId: req.user?.id });
        }
    }

    async getClassReport(req, res, next) {
        try {
            const data = await reportService.getClassReport(req.query);
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getClassReport', actorId: req.user?.id });
        }
    }

    async getStudentReport(req, res, next) {
        try {
            const data = await reportService.getStudentReport(req.query);
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getStudentReport', actorId: req.user?.id });
        }
    }

    async getStudentReportDetail(req, res, next) {
        try {
            const data = await reportService.getStudentReportDetail(req.params.studentId, req.query);
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getStudentReportDetail', actorId: req.user?.id });
        }
    }

    async getTeacherReport(req, res, next) {
        try {
            const data = await reportService.getTeacherReport(req.query);
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getTeacherReport', actorId: req.user?.id });
        }
    }

    async getSubjectReport(req, res, next) {
        try {
            const data = await reportService.getSubjectReport(req.query);
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getSubjectReport', actorId: req.user?.id });
        }
    }

    async getDetailReport(req, res, next) {
        try {
            const result = await reportService.getDetailReport(req.query, { paginate: true });
            res.json({
                success: true,
                data: result.rows,
                filters: result.filters,
                pagination: result.pagination
            });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getDetailReport', actorId: req.user?.id });
        }
    }

    async exportExcel(req, res, next) {
        try {
            const mode = req.query.mode || 'class';
            const { buffer, filename } = await exportService.generateExcel(mode, req.query);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            res.end(buffer);
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'exportExcel', actorId: req.user?.id });
        }
    }

    async exportPdf(req, res, next) {
        try {
            const mode = req.query.mode || 'class';
            const { buffer, filename } = await exportService.generatePdf(mode, req.query);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            res.end(buffer);
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'exportPdf', actorId: req.user?.id });
        }
    }

    // ==================== LA-05 Daily Student Report ====================

    async getDailyStudentReport(req, res, next) {
        try {
            const data = await dailyReportService.buildDailyMatrix(req.query, { paginate: true });
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getDailyStudentReport', actorId: req.user?.id });
        }
    }

    async exportDailyStudentExcel(req, res, next) {
        try {
            const { buffer, filename } = await dailyExportService.generateExcel(req.query, req.user?.id);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            res.end(buffer);
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'exportDailyStudentExcel', actorId: req.user?.id });
        }
    }

    async exportDailyStudentPdf(req, res, next) {
        try {
            const { buffer, filename } = await dailyExportService.generatePdf(req.query, req.user?.id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            res.end(buffer);
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'exportDailyStudentPdf', actorId: req.user?.id });
        }
    }

    // ==================== LA-06 Integrated Daily Report ====================

    async getIntegratedDailyReport(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const data = await integratedReportService.buildReport(req.query, {
                userId: req.user?.id, requestId: getRequestId(req)
            });
            res.json({ success: true, data });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getIntegratedDailyReport', actorId: req.user?.id });
        }
    }

    async getIntegratedDailyScope(req, res, next) {
        try {
            res.set('Cache-Control', 'no-store');
            const scope = await integratedReportService.resolveClassScope(req.user?.id);
            res.json({ success: true, data: { all_classes: scope.all_classes, class_ids: scope.class_ids } });
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'getIntegratedDailyScope', actorId: req.user?.id });
        }
    }

    async exportIntegratedDailyExcel(req, res, next) {
        try {
            const { buffer, filename } = await integratedExportService.generateExcel(
                req.query, { userId: req.user?.id, requestId: getRequestId(req) }
            );
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            res.end(buffer);
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'exportIntegratedDailyExcel', actorId: req.user?.id });
        }
    }

    async exportIntegratedDailyPdf(req, res, next) {
        try {
            const { buffer, filename } = await integratedExportService.generatePdf(
                req.query, { userId: req.user?.id, requestId: getRequestId(req) }
            );
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            res.end(buffer);
        } catch (error) {
            handleControllerError(res, next, error, { operation: 'exportIntegratedDailyPdf', actorId: req.user?.id });
        }
    }
}

module.exports = new LessonAttendanceController();
