const svc = require('./counseling_session.service');

exports.findAllByCaseId = async (req, res, next) => {
    try {
        res.json({ success: true, data: await svc.findAllByCaseId(req.params.caseId, req.query) });
    } catch (e) { next(e); }
};

exports.findById = async (req, res, next) => {
    try {
        res.json({ success: true, data: await svc.findById(req.params.id) });
    } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
    try {
        // If counselor_id is not provided, use current user
        const data = { ...req.body };
        if (!data.counselor_id && req.user) data.counselor_id = req.user.id;
        
        res.status(201).json({ success: true, data: await svc.create(data) });
    } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
    try {
        res.json({ success: true, data: await svc.update(req.params.id, req.body) });
    } catch (e) { next(e); }
};

exports.delete = async (req, res, next) => {
    try {
        await svc.delete(req.params.id);
        res.json({ success: true, message: 'Counseling session deleted' });
    } catch (e) { next(e); }
};

exports.getCaseTimeline = async (req, res, next) => {
    try {
        res.json({ success: true, data: await svc.getCaseTimeline(req.params.caseId) });
    } catch (e) { next(e); }
};
