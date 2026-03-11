const teacherService = require('./teacher.service');

exports.findAll = async (req, res, next) => {
    try {
        const result = await teacherService.findAll(req.query);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.findById = async (req, res, next) => {
    try {
        const result = await teacherService.findById(req.params.id);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const result = await teacherService.create(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const result = await teacherService.update(req.params.id, req.body);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
    try {
        await teacherService.delete(req.params.id);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) { next(err); }
};
