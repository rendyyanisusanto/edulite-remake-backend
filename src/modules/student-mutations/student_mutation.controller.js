'use strict';

const mutationService = require('./student_mutation.service');
const pdfService = require('./student_mutation_pdf.service');

exports.findAll = async (req, res, next) => {
    try {
        const data = await mutationService.findAll(req.query);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const data = await mutationService.findById(req.params.id);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.findByStudentId = async (req, res, next) => {
    try {
        const data = await mutationService.findByStudentId(req.params.id, req.query);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const data = await mutationService.create(req.body, req.user, req.file);
        res.status(201).json({
            success: true,
            message: 'Mutasi siswa berhasil dibuat',
            data
        });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const data = await mutationService.update(req.params.id, req.body, req.user, req.file);
        res.json({
            success: true,
            message: 'Mutasi siswa berhasil diperbarui',
            data
        });
    } catch (error) {
        next(error);
    }
};

exports.submit = async (req, res, next) => {
    try {
        const data = await mutationService.submit(req.params.id, req.body, req.user);
        res.json({ success: true, message: 'Mutasi berhasil diajukan', data });
    } catch (error) {
        next(error);
    }
};

exports.approve = async (req, res, next) => {
    try {
        const data = await mutationService.approve(req.params.id, req.body, req.user);
        res.json({ success: true, message: 'Mutasi berhasil disetujui', data });
    } catch (error) {
        next(error);
    }
};

exports.reject = async (req, res, next) => {
    try {
        const data = await mutationService.reject(req.params.id, req.body, req.user);
        res.json({ success: true, message: 'Mutasi berhasil ditolak', data });
    } catch (error) {
        next(error);
    }
};

exports.complete = async (req, res, next) => {
    try {
        const data = await mutationService.complete(req.params.id, req.body, req.user);
        res.json({ success: true, message: 'Mutasi berhasil difinalisasi', data });
    } catch (error) {
        next(error);
    }
};

exports.cancel = async (req, res, next) => {
    try {
        const data = await mutationService.cancel(req.params.id, req.body, req.user);
        res.json({ success: true, message: 'Mutasi berhasil dibatalkan', data });
    } catch (error) {
        next(error);
    }
};

exports.uploadDocument = async (req, res, next) => {
    try {
        const data = await mutationService.uploadDocument(req.params.id, req.file, req.user);
        res.json({ success: true, message: 'Dokumen mutasi berhasil diupload', data });
    } catch (error) {
        next(error);
    }
};

exports.print = async (req, res, next) => {
    try {
        const data = await pdfService.fetchPrintData(req.params.id);
        const pdfBuffer = await pdfService.generatePdf(data);
        const filename = `surat-mutasi-${data.mutation.id}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
    } catch (error) {
        next(error);
    }
};

exports.report = async (req, res, next) => {
    try {
        const data = await mutationService.report(req.query);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
