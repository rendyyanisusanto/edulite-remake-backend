'use strict';
const classReportService = require('./class_report.service');
const pdfService = require('../../services/pdfService');

const ok = (res, message, data) => res.json({ success: true, message, data });

exports.getClassReportData = async (req, res, next) => {
  try {
    const { academic_year_id } = req.query;
    if (!academic_year_id) {
      return res.status(400).json({
        success: false,
        message: 'academic_year_id wajib diisi',
        error_code: 'BAD_REQUEST'
      });
    }
    const data = await classReportService.getClassReportData(academic_year_id, req.params.classId);
    ok(res, 'Data laporan kelas berhasil diambil', data);
  } catch (e) {
    next(e);
  }
};

async function renderReport(req, res, next, mode) {
  try {
    const { academic_year_id } = req.query;
    if (!academic_year_id) {
      return res.status(400).json({
        success: false,
        message: 'academic_year_id wajib diisi',
        error_code: 'BAD_REQUEST'
      });
    }
    const output = await classReportService.renderReport(
      academic_year_id,
      req.params.classId,
      mode
    );

    if (mode === 'preview') {
      return pdfService.renderHtmlPreview(res, output.content);
    }
    return pdfService.renderPdfResponse(
      res,
      output.content,
      `laporan-siswa-kelas-${new Date().toISOString().slice(0, 10)}.pdf`
    );
  } catch (e) { next(e); }
}

exports.printPreview = (req, res, next) => renderReport(req, res, next, 'preview');
exports.printPdf = (req, res, next) => renderReport(req, res, next, 'pdf');
