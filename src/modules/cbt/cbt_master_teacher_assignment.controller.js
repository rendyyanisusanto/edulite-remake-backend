'use strict';
const service = require('./cbt_master_teacher_assignment.service');
const logger = require('../../core/logger') || console;

exports.findAll = async (req, res, next) => {
    try {
        const result = await service.findAll(req.query);
        res.json({
            success: true,
            message: 'Data penugasan guru berhasil diambil',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const result = await service.findById(req.params.id);
        res.json({
            success: true,
            message: 'Detail penugasan guru berhasil diambil',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const createdBy = req.user.id; // User id from auth middleware
        const result = await service.create(req.body, createdBy);
        res.status(201).json({
            success: true,
            message: 'Penugasan guru berhasil ditambahkan',
            data: result
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        if (error.statusCode === 400) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const updatedBy = req.user.id;
        const result = await service.update(req.params.id, req.body, updatedBy);
        res.json({
            success: true,
            message: 'Penugasan guru berhasil diperbarui',
            data: result
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        if (error.statusCode === 400) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

exports.updateStatus = async (req, res, next) => {
    try {
        if (req.body.is_active === undefined) {
            return res.status(400).json({ success: false, message: 'Status is_active wajib diisi' });
        }
        const result = await service.updateStatus(req.params.id, req.body.is_active);
        res.json({
            success: true,
            message: 'Status penugasan guru berhasil diperbarui',
            data: result
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        await service.delete(req.params.id);
        res.json({
            success: true,
            message: 'Penugasan guru berhasil dihapus'
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.statusCode === 400) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};
