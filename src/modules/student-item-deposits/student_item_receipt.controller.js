'use strict';

const svc = require('./student_item_receipt.service');
const pdfService = require('../../services/pdfService');

async function handle(kind, id, mode, res, next) {
    try {
        const out = await svc.render(kind, id, mode);
        if (mode === 'preview') return pdfService.renderHtmlPreview(res, out.content);
        return pdfService.renderPdfResponse(res, out.content, `nota-${kind}-${id}.pdf`);
    } catch (e) { next(e); }
}

exports.depositPreview = (req, res, next) => handle('deposit', req.params.deposit_id, 'preview', res, next);
exports.depositPdf = (req, res, next) => handle('deposit', req.params.deposit_id, 'pdf', res, next);
exports.loanPreview = (req, res, next) => handle('loan', req.params.loan_id, 'preview', res, next);
exports.loanPdf = (req, res, next) => handle('loan', req.params.loan_id, 'pdf', res, next);
exports.dailyReturnPreview = (req, res, next) => handle('daily-return', req.params.loan_id, 'preview', res, next);
exports.dailyReturnPdf = (req, res, next) => handle('daily-return', req.params.loan_id, 'pdf', res, next);
exports.finalReturnPreview = (req, res, next) => handle('final-return', req.params.final_return_id, 'preview', res, next);
exports.finalReturnPdf = (req, res, next) => handle('final-return', req.params.final_return_id, 'pdf', res, next);
