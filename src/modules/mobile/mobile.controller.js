'use strict';

const svc = require('./mobile.service');

exports.searchStudents = async (req, res, next) => {
    try {
        const students = await svc.searchStudents(req.query.q, req.query.limit);
        res.json({ success: true, data: students });
    } catch (e) { next(e); }
};

exports.getMyStudentItemDeposits = async (req, res, next) => {
    try {
        const result = await svc.getMyStudentItemDeposits(req.user, req.query);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

exports.getMyStudentItemLoans = async (req, res, next) => {
    try {
        const result = await svc.getMyStudentItemLoans(req.user, req.query);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

exports.getActiveStudentItemDeposits = async (req, res, next) => {
    try {
        const result = await svc.getActiveStudentItemDeposits(req.user, req.query);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

// ==========================================
// VIOLATIONS
// ==========================================

exports.submitViolation = async (req, res, next) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.photo = await svc.uploadPhoto(req.file, 'mobile-reports/violations');
        }
        const record = await svc.submitViolationReport(data, req.user.id);
        res.status(201).json({ success: true, message: 'Laporan pelanggaran berhasil dikirim.', data: record });
    } catch (e) { next(e); }
};

exports.getMyViolations = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await svc.getMyViolations(req.user.id, parseInt(page), parseInt(limit));
        res.json({ success: true, data: result.data, meta: { total: result.totalItems, pages: result.totalPages } });
    } catch (e) { next(e); }
};

exports.getViolationDetail = async (req, res, next) => {
    try {
        const record = await svc.getViolationDetail(req.params.id, req.user.id);
        res.json({ success: true, data: record });
    } catch (e) { next(e); }
};

// ==========================================
// POSITIVE POINTS
// ==========================================

exports.submitPositivePoint = async (req, res, next) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.photo = await svc.uploadPhoto(req.file, 'mobile-reports/positive-points');
        }
        const record = await svc.submitPositiveReport(data, req.user.id);
        res.status(201).json({ success: true, message: 'Laporan kelakuan positif berhasil dikirim.', data: record });
    } catch (e) { next(e); }
};

exports.getMyPositivePoints = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await svc.getMyPositivePoints(req.user.id, parseInt(page), parseInt(limit));
        res.json({ success: true, data: result.data, meta: { total: result.totalItems, pages: result.totalPages } });
    } catch (e) { next(e); }
};

exports.getPositivePointDetail = async (req, res, next) => {
    try {
        const record = await svc.getPositivePointDetail(req.params.id, req.user.id);
        res.json({ success: true, data: record });
    } catch (e) { next(e); }
};
