'use strict';

const svc = require('./document_setting.service');

exports.list = async (req, res, next) => {
    try {
        const { document_type, school_profile_id, is_active } = req.query;
        const records = await svc.findAll({ document_type, school_profile_id, is_active });
        res.json({ success: true, data: records });
    } catch (e) { next(e); }
};

exports.detail = async (req, res, next) => {
    try {
        const record = await svc.findById(req.params.id);
        res.json({ success: true, data: record });
    } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
    try {
        const record = await svc.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Pengaturan dokumen berhasil dibuat',
            data: record
        });
    } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
    try {
        const record = await svc.update(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Pengaturan dokumen berhasil diperbarui',
            data: record
        });
    } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const record = await svc.updateStatus(req.params.id, req.body);
        res.json({
            success: true,
            message: `Pengaturan dokumen berhasil ${record.is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
            data: record
        });
    } catch (e) { next(e); }
};

exports.uploadAsset = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File tidak ditemukan dalam request.' });
        }
        const { id, field } = req.params;
        const result = await svc.uploadAsset(id, field, req.file);
        res.json({
            success: true,
            message: 'File berhasil diupload',
            data: result
        });
    } catch (e) { next(e); }
};
