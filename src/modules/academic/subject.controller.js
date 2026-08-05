const subjectService = require('./subject.service');

exports.findAll = async (req, res, next) => {
    try {
        const result = await subjectService.findAll(req.query);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.findById = async (req, res, next) => {
    try {
        const result = await subjectService.findById(req.params.id);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const result = await subjectService.create(req.body, req.user);
        res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const result = await subjectService.update(req.params.id, req.body, req.user);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.toggleActive = async (req, res, next) => {
    try {
        const result = await subjectService.toggleActive(req.params.id, req.user);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
    try {
        await subjectService.delete(req.params.id);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) { next(err); }
};

