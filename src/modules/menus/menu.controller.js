'use strict';
const svc = require('./menu.service');

exports.findAll = async (req, res, next) => {
    try {
        const data = await svc.findAll();
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

exports.getMyMenus = async (req, res, next) => {
    try {
        const data = await svc.getMenuForUser(req.user.id);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

exports.toggleStatus = async (req, res, next) => {
    try {
        const { is_active } = req.body;
        const data = await svc.toggleMenuStatus(req.params.id, is_active);
        res.json({ success: true, data, message: 'Menu status updated' });
    } catch (e) { next(e); }
};

exports.updatePermission = async (req, res, next) => {
    try {
        const { permission_code } = req.body;
        const data = await svc.updateMenuPermission(req.params.id, permission_code);
        res.json({ success: true, data, message: 'Menu permission updated' });
    } catch (e) { next(e); }
};
