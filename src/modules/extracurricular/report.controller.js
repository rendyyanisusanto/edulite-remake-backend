'use strict';

const reportService = require('./report.service');

const ok = (res, data, message) => res.json({ success: true, ...(message ? { message } : {}), data });

const reportTypeMap = {
    members: 'members',
    studentAttendance: 'student-attendance',
    coachAttendance: 'coach-attendance',
    studentProgress: 'student-progress',
    sessions: 'sessions',
    ranking: 'ranking',
    dashboard: 'dashboard'
};

async function listByType(res, next, type, query) {
    try {
        ok(res, await reportService.getReportByType(type, query));
    } catch (e) {
        next(e);
    }
}

async function exportExcel(res, next, type, query) {
    try {
        const workbook = await reportService.exportExcel(type, query);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="laporan_ekskul_${type}_${Date.now()}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (e) {
        next(e);
    }
}

async function exportPdf(res, next, type, query) {
    try {
        const buffer = await reportService.exportPdf(type, query);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="laporan_ekskul_${type}_${Date.now()}.pdf"`);
        res.send(buffer);
    } catch (e) {
        next(e);
    }
}

exports.getMembersReport = async (req, res, next) => listByType(res, next, reportTypeMap.members, req.query);
exports.getStudentAttendanceReport = async (req, res, next) => listByType(res, next, reportTypeMap.studentAttendance, req.query);
exports.getCoachAttendanceReport = async (req, res, next) => listByType(res, next, reportTypeMap.coachAttendance, req.query);
exports.getStudentProgressReport = async (req, res, next) => listByType(res, next, reportTypeMap.studentProgress, req.query);
exports.getSessionsReport = async (req, res, next) => listByType(res, next, reportTypeMap.sessions, req.query);
exports.getRankingReport = async (req, res, next) => listByType(res, next, reportTypeMap.ranking, req.query);
exports.getDashboardReport = async (req, res, next) => listByType(res, next, reportTypeMap.dashboard, req.query);

exports.exportMembersExcel = async (req, res, next) => exportExcel(res, next, reportTypeMap.members, req.query);
exports.exportStudentAttendanceExcel = async (req, res, next) => exportExcel(res, next, reportTypeMap.studentAttendance, req.query);
exports.exportCoachAttendanceExcel = async (req, res, next) => exportExcel(res, next, reportTypeMap.coachAttendance, req.query);
exports.exportStudentProgressExcel = async (req, res, next) => exportExcel(res, next, reportTypeMap.studentProgress, req.query);
exports.exportSessionsExcel = async (req, res, next) => exportExcel(res, next, reportTypeMap.sessions, req.query);
exports.exportRankingExcel = async (req, res, next) => exportExcel(res, next, reportTypeMap.ranking, req.query);
exports.exportDashboardExcel = async (req, res, next) => exportExcel(res, next, reportTypeMap.dashboard, req.query);

exports.exportMembersPdf = async (req, res, next) => exportPdf(res, next, reportTypeMap.members, req.query);
exports.exportStudentAttendancePdf = async (req, res, next) => exportPdf(res, next, reportTypeMap.studentAttendance, req.query);
exports.exportCoachAttendancePdf = async (req, res, next) => exportPdf(res, next, reportTypeMap.coachAttendance, req.query);
exports.exportStudentProgressPdf = async (req, res, next) => exportPdf(res, next, reportTypeMap.studentProgress, req.query);
exports.exportSessionsPdf = async (req, res, next) => exportPdf(res, next, reportTypeMap.sessions, req.query);
exports.exportRankingPdf = async (req, res, next) => exportPdf(res, next, reportTypeMap.ranking, req.query);
exports.exportDashboardPdf = async (req, res, next) => exportPdf(res, next, reportTypeMap.dashboard, req.query);
