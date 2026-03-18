'use strict';

const guestbookService = require('./guestbook.service');

exports.findAll = async (req, res, next) => {
    try {
        const result = await guestbookService.findAll(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const item = await guestbookService.findById(req.params.id);
        res.json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const data = {
            ...req.body,
            created_by: req.user?.id,
            updated_by: req.user?.id
        };
        const item = await guestbookService.create(data);
        res.status(201).json({
            success: true,
            message: 'Data tamu berhasil ditambahkan',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const data = {
            ...req.body,
            updated_by: req.user?.id
        };
        const item = await guestbookService.update(req.params.id, data);
        res.json({
            success: true,
            message: 'Data tamu berhasil diperbarui',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

exports.checkout = async (req, res, next) => {
    try {
        const item = await guestbookService.checkout(req.params.id, req.user?.id);
        res.json({
            success: true,
            message: 'Tamu berhasil checkout',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

exports.cancel = async (req, res, next) => {
    try {
        const item = await guestbookService.cancel(req.params.id, req.user?.id);
        res.json({
            success: true,
            message: 'Kunjungan berhasil dibatalkan',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        await guestbookService.delete(req.params.id);
        res.json({
            success: true,
            message: 'Data tamu berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

exports.exportExcel = async (req, res, next) => {
    try {
        await guestbookService.exportExcel(res, req.query);
    } catch (error) {
        next(error);
    }
};

exports.exportPdf = async (req, res, next) => {
    try {
        await guestbookService.exportPdf(res, req.query);
    } catch (error) {
        next(error);
    }
};
