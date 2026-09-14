'use strict';
const service = require('./cbt_question.service');
const logger = require('../../core/logger') || console;

exports.findAll = async (req, res, next) => {
    try {
        const bankId = req.params.bankId;
        const userId = req.user.id;
        const hasViewAllAccess = req.user.permissions?.includes('cbt.question_bank.view_all') || false;

        const options = {
            userId,
            hasViewAllAccess,
            page: req.query.page || 1,
            limit: req.query.limit || 10,
            search: req.query.search || '',
            question_type: req.query.question_type,
            difficulty: req.query.difficulty,
            status: req.query.status,
            sort_by: req.query.sort_by,
            sort_order: req.query.sort_order
        };

        const result = await service.findAll(bankId, options);
        res.json({
            success: true,
            message: 'Daftar soal berhasil diambil',
            data: result
        });
    } catch (error) {
        if (logger.error) logger.error(`Error findAll CBT Question: ${error.message}`);
        if (error.message.includes('akses')) return res.status(403).json({ success: false, message: error.message });
        if (error.message.includes('ditemukan')) return res.status(404).json({ success: false, message: error.message });
        next(error);
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const { bankId, id } = req.params;
        const userId = req.user.id;
        const hasViewAllAccess = req.user.permissions?.includes('cbt.question_bank.view_all') || false;

        const result = await service.findById(bankId, id, userId, hasViewAllAccess);
        res.json({
            success: true,
            message: 'Detail soal berhasil diambil',
            data: result
        });
    } catch (error) {
        if (logger.error) logger.error(`Error findOne CBT Question: ${error.message}`);
        if (error.message.includes('akses')) return res.status(403).json({ success: false, message: error.message });
        if (error.message.includes('ditemukan')) return res.status(404).json({ success: false, message: error.message });
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const bankId = req.params.bankId;
        const userId = req.user.id;
        const hasViewAllAccess = req.user.permissions?.includes('cbt.question_bank.view_all') || false;

        const data = req.body;
        const question = await service.create(bankId, data, userId, hasViewAllAccess);

        res.status(201).json({
            success: true,
            message: 'Soal berhasil disimpan sebagai draf.',
            data: question
        });
    } catch (error) {
        if (logger.error) logger.error(`Error create CBT Question: ${error.message}`);
        if (error.message.includes('akses') || error.message.includes('diarsipkan')) return res.status(403).json({ success: false, message: error.message });
        if (error.message.includes('wajib') || error.message.includes('valid') || error.message.includes('kosong') || error.message.includes('harus')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const { bankId, id } = req.params;
        const userId = req.user.id;
        const hasViewAllAccess = req.user.permissions?.includes('cbt.question_bank.view_all') || false;

        const data = req.body;
        const question = await service.update(bankId, id, data, userId, hasViewAllAccess);

        res.json({
            success: true,
            message: 'Soal berhasil diperbarui.',
            data: question
        });
    } catch (error) {
        if (logger.error) logger.error(`Error update CBT Question: ${error.message}`);
        if (error.message.includes('akses') || error.message.includes('diarsipkan')) return res.status(403).json({ success: false, message: error.message });
        if (error.message.includes('ditemukan')) return res.status(404).json({ success: false, message: error.message });
        if (error.message.includes('valid') || error.message.includes('harus') || error.message.includes('kosong')) return res.status(400).json({ success: false, message: error.message });
        next(error);
    }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const { bankId, id } = req.params;
        const userId = req.user.id;
        const hasViewAllAccess = req.user.permissions?.includes('cbt.question_bank.view_all') || false;

        const newStatus = req.body.status;
        const question = await service.updateStatus(bankId, id, newStatus, userId, hasViewAllAccess);

        res.json({
            success: true,
            message: newStatus === 'ACTIVE' ? 'Soal berhasil diaktifkan.' : `Soal berhasil diubah ke status ${newStatus}.`,
            data: question
        });
    } catch (error) {
        if (logger.error) logger.error(`Error status update CBT Question: ${error.message}`);
        if (error.message.includes('akses') || error.message.includes('diarsipkan')) return res.status(403).json({ success: false, message: error.message });
        if (error.message.includes('ditemukan')) return res.status(404).json({ success: false, message: error.message });
        if (error.message.includes('valid') || error.message.includes('harus')) return res.status(400).json({ success: false, message: error.message });
        next(error);
    }
};

exports.duplicate = async (req, res, next) => {
    try {
        const { bankId, id } = req.params;
        const userId = req.user.id;
        const hasViewAllAccess = req.user.permissions?.includes('cbt.question_bank.view_all') || false;

        const duplicatedQuestion = await service.duplicate(bankId, id, userId, hasViewAllAccess);

        res.status(201).json({
            success: true,
            message: 'Soal berhasil digandakan.',
            data: duplicatedQuestion
        });
    } catch (error) {
        if (logger.error) logger.error(`Error duplicate CBT Question: ${error.message}`);
        if (error.message.includes('akses') || error.message.includes('diarsipkan')) return res.status(403).json({ success: false, message: error.message });
        if (error.message.includes('ditemukan')) return res.status(404).json({ success: false, message: error.message });
        next(error);
    }
};
