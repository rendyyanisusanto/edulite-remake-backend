const svc = require('./counseling_case.service');

exports.findAll = async (req, res, next) => {
    try {
        res.json({ success: true, data: await svc.findAll(req.query) });
    } catch (e) { next(e); }
};

exports.getStats = async (req, res, next) => {
    try {
        res.json({ success: true, data: await svc.getSummaryStats() });
    } catch (e) { next(e); }
};

exports.getFollowups = async (req, res, next) => {
    try {
        res.json({ success: true, data: await svc.getFollowups(req.query) });
    } catch (e) { next(e); }
};

exports.findById = async (req, res, next) => {
    try {
        res.json({ success: true, data: await svc.findById(req.params.id) });
    } catch (e) { next(e); }
};

exports.findByStudentId = async (req, res, next) => {
    try {
        res.json({ success: true, data: await svc.findByStudentId(req.params.studentId, req.query) });
    } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        res.status(201).json({ success: true, data: await svc.create(req.body, userId) });
    } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        res.json({ success: true, data: await svc.update(req.params.id, req.body, userId) });
    } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { status } = req.body;
        if (!status) return res.status(400).json({ success: false, message: 'Status is required' });
        res.json({ success: true, data: await svc.updateStatus(req.params.id, status, userId) });
    } catch (e) { next(e); }
};

exports.delete = async (req, res, next) => {
    try {
        await svc.delete(req.params.id);
        res.json({ success: true, message: 'Counseling case deleted' });
    } catch (e) { next(e); }
};
