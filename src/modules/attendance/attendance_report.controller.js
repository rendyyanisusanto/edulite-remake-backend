'use strict';
const svc = require('./attendance_report.service');

exports.getSummary = async (req, res, next) => {
    try {
        res.json({ success: true, data: await svc.getSummary(req.query) });
    } catch (e) { next(e); }
};

exports.exportExcel = async (req, res, next) => {
    try {
        const workbook = await svc.exportExcel(req.query);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="laporan_absensi_${Date.now()}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (e) { next(e); }
};
