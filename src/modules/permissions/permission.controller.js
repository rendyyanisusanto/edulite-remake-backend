'use strict';
const svc = require('./permission.service');

exports.findAll = async (req, res, next) => {
    try {
        const data = await svc.findAll(req.query);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

exports.findAllGrouped = async (req, res, next) => {
    try {
        const data = await svc.findAllGrouped();
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
        res.status(201).json({ success: true, data, message: 'Permission created successfully' });
    } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
    try {
        const data = await svc.update(req.params.id, req.body);
        res.json({ success: true, data, message: 'Permission updated successfully' });
    } catch (e) { next(e); }
};
