'use strict';
const service = require('./cbt_master_student_account.service');
const logger = require('../../core/logger') || console;

exports.findAll = async (req, res, next) => {
    try {
        const result = await service.findAll(req.query);
        res.json({
            success: true,
            message: 'Data akun peserta berhasil diambil',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.createSingle = async (req, res, next) => {
    try {
        const { student_id } = req.body;
        if (!student_id) return res.status(400).json({ success: false, message: 'student_id wajib diisi' });

        const result = await service.createSingle(student_id);
        res.status(201).json({
            success: true,
            message: 'Akun siswa berhasil dibuat',
            data: result
        });
    } catch (error) {
        if (error.statusCode === 409 || error.statusCode === 400 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
};

exports.createBulk = async (req, res, next) => {
    try {
        const { student_ids } = req.body;
        if (!Array.isArray(student_ids) || student_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Daftar student_ids tidak valid' });
        }

        const result = await service.createBulk(student_ids);
        res.status(201).json({
            success: true,
            message: 'Proses pembuatan akun massal selesai',
            data: result
        });
    } catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({ success: false, message: error.message, ...error });
        }
        next(error);
    }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const { is_active } = req.body;
        if (is_active === undefined) {
            return res.status(400).json({ success: false, message: 'Status is_active wajib diisi' });
        }

        await service.updateStatus(req.params.id, is_active);
        res.json({
            success: true,
            message: 'Status akun siswa berhasil diperbarui'
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const result = await service.resetPassword(req.params.id);
        res.json({
            success: true,
            message: 'Password akun siswa berhasil direset',
            data: result
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};
