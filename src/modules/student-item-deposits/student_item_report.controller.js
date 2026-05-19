'use strict';

const svc = require('./student_item_report.service');
const pdfService = require('../../services/pdfService');

const ok = (res, message, data) => res.json({ success: true, message, data });

exports.summary = async (req, res, next) => { try { ok(res, 'Ringkasan laporan berhasil diambil', await svc.getSummary(req.query)); } catch (e) { next(e); } };
exports.activeItems = async (req, res, next) => { try { ok(res, 'Laporan barang aktif berhasil diambil', await svc.getActiveItems(req.query)); } catch (e) { next(e); } };
exports.dailyLoans = async (req, res, next) => { try { ok(res, 'Laporan peminjaman harian berhasil diambil', await svc.getDailyLoans(req.query)); } catch (e) { next(e); } };
exports.unreturnedItems = async (req, res, next) => { try { ok(res, 'Laporan barang belum kembali berhasil diambil', await svc.getUnreturnedItems(req.query)); } catch (e) { next(e); } };
exports.finalReturns = async (req, res, next) => { try { ok(res, 'Laporan pengambilan permanen berhasil diambil', await svc.getFinalReturns(req.query)); } catch (e) { next(e); } };
exports.problemItems = async (req, res, next) => { try { ok(res, 'Laporan barang bermasalah berhasil diambil', await svc.getProblemItems(req.query)); } catch (e) { next(e); } };
exports.studentBehavior = async (req, res, next) => { try { ok(res, 'Laporan behavior siswa berhasil diambil', await svc.getStudentBehavior(req.query)); } catch (e) { next(e); } };
exports.classSummary = async (req, res, next) => { try { ok(res, 'Laporan rekap per kelas berhasil diambil', await svc.getClassSummary(req.query)); } catch (e) { next(e); } };
exports.studentHistory = async (req, res, next) => { try { ok(res, 'Histori siswa berhasil diambil', await svc.getStudentHistory(req.params.student_id)); } catch (e) { next(e); } };

async function render(type, req, res, next, mode, studentId = null) {
    try {
        const out = await svc.renderReport(type, req.query, mode, studentId);
        if (mode === 'preview') return pdfService.renderHtmlPreview(res, out.content);
        return pdfService.renderPdfResponse(res, out.content, `laporan-${type}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) { next(e); }
}

exports.activeItemsPreview = (req, res, next) => render('active-items', req, res, next, 'preview');
exports.dailyLoansPreview = (req, res, next) => render('daily-loans', req, res, next, 'preview');
exports.unreturnedItemsPreview = (req, res, next) => render('unreturned-items', req, res, next, 'preview');
exports.finalReturnsPreview = (req, res, next) => render('final-returns', req, res, next, 'preview');
exports.problemItemsPreview = (req, res, next) => render('problem-items', req, res, next, 'preview');
exports.studentBehaviorPreview = (req, res, next) => render('student-behavior', req, res, next, 'preview');
exports.classSummaryPreview = (req, res, next) => render('class-summary', req, res, next, 'preview');
exports.studentHistoryPreview = (req, res, next) => render('student-history', req, res, next, 'preview', req.params.student_id);

exports.activeItemsPdf = (req, res, next) => render('active-items', req, res, next, 'pdf');
exports.dailyLoansPdf = (req, res, next) => render('daily-loans', req, res, next, 'pdf');
exports.unreturnedItemsPdf = (req, res, next) => render('unreturned-items', req, res, next, 'pdf');
exports.finalReturnsPdf = (req, res, next) => render('final-returns', req, res, next, 'pdf');
exports.problemItemsPdf = (req, res, next) => render('problem-items', req, res, next, 'pdf');
exports.studentBehaviorPdf = (req, res, next) => render('student-behavior', req, res, next, 'pdf');
exports.classSummaryPdf = (req, res, next) => render('class-summary', req, res, next, 'pdf');
exports.studentHistoryPdf = (req, res, next) => render('student-history', req, res, next, 'pdf', req.params.student_id);
