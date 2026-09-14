'use strict';
const service = require('./cbt_question_bank.service');
const logger = require('../../core/logger') || console;

exports.findAll = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const hasViewAllAccess = req.user.permissions?.includes('cbt.question_bank.view_all') || false;

        const options = {
            userId,
            hasViewAllAccess,
            page: req.query.page || 1,
            limit: req.query.limit || 10,
            search: req.query.search || '',
            subject_id: req.query.subject_id,
            grade_id: req.query.grade_id,
            academic_year_id: req.query.academic_year_id,
            semester: req.query.semester,
            status: req.query.status,
            created_by: req.query.created_by,
            sort_by: req.query.sort_by,
            sort_order: req.query.sort_order
        };

        const result = await service.findAll(options);
        res.json({
            success: true,
            message: 'Daftar Bank Soal berhasil diambil',
            data: result
        });
    } catch (error) {
        if (logger.error) logger.error(`Error findAll CBT Bank Soal: ${error.message}`);
        next(error);
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        const hasViewAllAccess = req.user.permissions?.includes('cbt.question_bank.view_all') || false;

        const result = await service.findById(id, userId, hasViewAllAccess);
        res.json({
            success: true,
            message: 'Detail Bank Soal berhasil diambil',
            data: result
        });
    } catch (error) {
        if (logger.error) logger.error(`Error findOne CBT Bank Soal: ${error.message}`);
        if (error.message.includes('akses')) return res.status(403).json({ success: false, message: error.message });
        if (error.message.includes('ditemukan')) return res.status(404).json({ success: false, message: error.message });
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const hasViewAllAccess = req.user.permissions?.includes('cbt.question_bank.view_all') || false;

        const data = req.body;
        const bank = await service.create(data, userId, hasViewAllAccess);

        res.status(201).json({
            success: true,
            message: 'Bank soal berhasil dibuat.',
            data: bank
        });
    } catch (error) {
        if (logger.error) logger.error(`Error create CBT Bank Soal: ${error.message}`);
        if (error.message.includes('penugasan')) return res.status(403).json({ success: false, message: error.message });
        if (error.message.includes('wajib') || error.message.includes('valid')) return res.status(400).json({ success: false, message: error.message });
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        const hasViewAllAccess = req.user.permissions?.includes('cbt.question_bank.view_all') || false;

        const data = req.body;
        const bank = await service.update(id, data, userId, hasViewAllAccess);

        res.json({
            success: true,
            message: 'Bank soal berhasil diperbarui.',
            data: bank
        });
    } catch (error) {
        if (logger.error) logger.error(`Error update CBT Bank Soal: ${error.message}`);
        if (error.message.includes('izin')) return res.status(403).json({ success: false, message: error.message });
        if (error.message.includes('ditemukan')) return res.status(404).json({ success: false, message: error.message });
        if (error.message.includes('valid') || error.message.includes('penugasan')) return res.status(400).json({ success: false, message: error.message });
        next(error);
    }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        const hasViewAllAccess = req.user.permissions?.includes('cbt.question_bank.view_all') || false;

        const newStatus = req.body.status;
        const bank = await service.archive(id, userId, hasViewAllAccess, newStatus);

        res.json({
            success: true,
            message: newStatus === 'ARCHIVED' ? 'Bank soal berhasil diarsipkan.' : 'Bank soal berhasil diaktifkan.',
            data: bank
        });
    } catch (error) {
        if (logger.error) logger.error(`Error archive CBT Bank Soal: ${error.message}`);
        if (error.message.includes('izin')) return res.status(403).json({ success: false, message: error.message });
        if (error.message.includes('ditemukan')) return res.status(404).json({ success: false, message: error.message });
        if (error.message.includes('valid')) return res.status(400).json({ success: false, message: error.message });
        next(error);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        const hasViewAllAccess = req.user.permissions?.includes('cbt.question_bank.view_all') || false;

        await service.remove(id, userId, hasViewAllAccess);

        res.json({
            success: true,
            message: 'Bank soal berhasil dihapus.',
            data: null
        });
    } catch (error) {
        if (logger.error) logger.error(`Error remove CBT Bank Soal: ${error.message}`);
        if (error.message.includes('izin') || error.message.includes('permanen')) return res.status(403).json({ success: false, message: error.message });
        if (error.message.includes('ditemukan')) return res.status(404).json({ success: false, message: error.message });
        next(error);
    }
};
