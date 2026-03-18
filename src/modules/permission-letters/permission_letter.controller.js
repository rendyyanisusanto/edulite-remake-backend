'use strict';

const svc = require('./permission_letter.service');
const pdfSvc = require('./permission_letter_pdf.service');

exports.generateCode = async (req, res, next) => {
    try {
        const code = await svc.generateCode();
        res.json({ success: true, data: { code } });
    } catch (e) { next(e); }
};

exports.findAll = async (req, res, next) => {
    try {
        const result = await svc.findAll(req.query);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

exports.findById = async (req, res, next) => {
    try {
        const item = await svc.findById(req.params.id);
        res.json({ success: true, data: item });
    } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
    try {
        const data = {
            ...req.body,
            created_by: req.user?.id,
            updated_by: req.user?.id
        };
        const item = await svc.create(data);
        res.status(201).json({
            success: true,
            message: 'Surat izin berhasil dibuat',
            data: item
        });
    } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
    try {
        const data = {
            ...req.body,
            updated_by: req.user?.id
        };
        const item = await svc.update(req.params.id, data);
        res.json({
            success: true,
            message: 'Surat izin berhasil diperbarui',
            data: item
        });
    } catch (e) { next(e); }
};

exports.submit = async (req, res, next) => {
    try {
        const item = await svc.submit(req.params.id, req.user?.id);
        res.json({ success: true, message: 'Surat izin berhasil diajukan', data: item });
    } catch (e) { next(e); }
};

exports.approve = async (req, res, next) => {
    try {
        const item = await svc.approve(req.params.id, req.user?.id);
        res.json({ success: true, message: 'Surat izin berhasil disetujui', data: item });
    } catch (e) { next(e); }
};

exports.reject = async (req, res, next) => {
    try {
        const item = await svc.reject(req.params.id, req.user?.id);
        res.json({ success: true, message: 'Surat izin berhasil ditolak', data: item });
    } catch (e) { next(e); }
};

exports.cancel = async (req, res, next) => {
    try {
        const item = await svc.cancel(req.params.id, req.user?.id);
        res.json({ success: true, message: 'Surat izin berhasil dibatalkan', data: item });
    } catch (e) { next(e); }
};

exports.delete = async (req, res, next) => {
    try {
        await svc.delete(req.params.id);
        res.json({ success: true, message: 'Surat izin berhasil dihapus' });
    } catch (e) { next(e); }
};

exports.printPdf = async (req, res, next) => {
    try {
        const letter = await pdfSvc.fetchPrintData(req.params.id);
        const pdfBuffer = await pdfSvc.generatePdf(letter);

        const filename = `surat-izin-${letter.code || req.params.id}.pdf`
            .replace(/\//g, '-')
            .replace(/\s+/g, '_');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
    } catch (e) { next(e); }
};
