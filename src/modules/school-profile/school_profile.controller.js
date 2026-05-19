'use strict';

const svc = require('./school_profile.service');

exports.get = async (req, res, next) => {
    try {
        const profile = await svc.findOne();
        res.json({ success: true, data: profile || null });
    } catch (e) { next(e); }
};

exports.getPublic = async (req, res, next) => {
    try {
        const profile = await svc.findOne();
        if (!profile) return res.json({ success: true, data: null });
        
        // Return only public branding fields
        res.json({
            success: true,
            data: {
                name: profile.name,
                short_name: profile.short_name,
                logo: profile.logo,
                school_icon: profile.school_icon
            }
        });
    } catch (e) { next(e); }
};

exports.upsert = async (req, res, next) => {
    try {
        const profile = await svc.upsert(req.body);
        res.json({
            success: true,
            message: 'Profil sekolah berhasil disimpan',
            data: profile
        });
    } catch (e) { next(e); }
};

exports.uploadAsset = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File tidak ditemukan dalam request.' });
        }
        const { field } = req.params;
        const result = await svc.uploadAsset(field, req.file);
        res.json({
            success: true,
            message: 'File berhasil diupload',
            data: result
        });
    } catch (e) { next(e); }
};
