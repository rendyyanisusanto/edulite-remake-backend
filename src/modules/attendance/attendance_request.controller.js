'use strict';
const svc = require('./attendance_request.service');

exports.findAll = async (req, res, next) => { try { res.json({ success: true, data: await svc.findAll(req.query) }); } catch (e) { next(e); } };
exports.findById = async (req, res, next) => { try { res.json({ success: true, data: await svc.findById(req.params.id) }); } catch (e) { next(e); } };

exports.approve = async (req, res, next) => {
    try {
        const { review_note } = req.body;
        const data = await svc.approve(req.params.id, req.user.id, review_note);
        res.json({ success: true, message: 'Request approved', data });
    } catch (e) { next(e); }
};

exports.reject = async (req, res, next) => {
    try {
        const { review_note } = req.body;
        if (!review_note) return res.status(422).json({ success: false, message: 'Review note is required for rejection' });
        const data = await svc.reject(req.params.id, req.user.id, review_note);
        res.json({ success: true, message: 'Request rejected', data });
    } catch (e) { next(e); }
};
