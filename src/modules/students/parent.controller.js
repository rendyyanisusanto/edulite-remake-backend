const parentService = require('./parent.service');

exports.findAll = async (req, res, next) => {
    try {
        const result = await parentService.findAll(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const resource = await parentService.findById(req.params.id);
        res.json({ success: true, data: resource });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const resource = await parentService.create(req.body);
        res.status(201).json({ success: true, message: 'Parent profile created', data: resource });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const resource = await parentService.update(req.params.id, req.body);
        res.json({ success: true, message: 'Parent profile updated', data: resource });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        await parentService.delete(req.params.id);
        res.json({ success: true, message: 'Parent profile deleted' });
    } catch (error) {
        next(error);
    }
};
