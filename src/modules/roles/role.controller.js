'use strict';
const svc = require('./role.service');

exports.findAll = async (req, res, next) => {
    try {
        const data = await svc.findAll(req.query);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

exports.findById = async (req, res, next) => {
    try {
        const data = await svc.findById(req.params.id);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
    try {
        const data = await svc.create(req.body);
        res.status(201).json({ success: true, data, message: 'Role created successfully' });
    } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
    try {
        const data = await svc.update(req.params.id, req.body);
        res.json({ success: true, data, message: 'Role updated successfully' });
    } catch (e) { next(e); }
};

exports.delete = async (req, res, next) => {
    try {
        await svc.delete(req.params.id);
        res.json({ success: true, message: 'Role deleted successfully' });
    } catch (e) { next(e); }
};

exports.getPermissions = async (req, res, next) => {
    try {
        const data = await svc.getPermissions(req.params.id);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

exports.syncPermissions = async (req, res, next) => {
    try {
        const { permission_ids } = req.body;
        if (!Array.isArray(permission_ids)) {
            return res.status(400).json({ success: false, message: 'permission_ids must be an array' });
        }
        const data = await svc.syncPermissions(req.params.id, permission_ids);
        res.json({ success: true, data, message: 'Permissions updated successfully' });
    } catch (e) { next(e); }
};
