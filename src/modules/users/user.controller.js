'use strict';
const svc = require('./user.service');

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
        res.status(201).json({ success: true, data, message: 'User created successfully' });
    } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
    try {
        const data = await svc.update(req.params.id, req.body);
        res.json({ success: true, data, message: 'User updated successfully' });
    } catch (e) { next(e); }
};

exports.syncRoles = async (req, res, next) => {
    try {
        const { role_ids } = req.body;
        if (!Array.isArray(role_ids)) {
            return res.status(400).json({ success: false, message: 'role_ids must be an array' });
        }
        const data = await svc.syncRoles(req.params.id, role_ids);
        res.json({ success: true, data, message: 'Roles updated successfully' });
    } catch (e) { next(e); }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const data = await svc.resetPassword(req.params.id, req.body);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

exports.toggleStatus = async (req, res, next) => {
    try {
        const data = await svc.toggleStatus(req.params.id, req.body);
        res.json({ success: true, data, message: 'User status updated successfully' });
    } catch (e) { next(e); }
};

exports.getMyPermissions = async (req, res, next) => {
    try {
        const data = await svc.getUserPermissions(req.user.id);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};
