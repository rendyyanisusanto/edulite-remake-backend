const academicYearService = require('./academic_year.service');

exports.findAll = async (req, res, next) => {
    try {
        const result = await academicYearService.findAll(req.query);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.findById = async (req, res, next) => {
    try {
        const result = await academicYearService.findById(req.params.id);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const result = await academicYearService.create(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const result = await academicYearService.update(req.params.id, req.body);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
    try {
        await academicYearService.delete(req.params.id);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) { next(err); }
};
