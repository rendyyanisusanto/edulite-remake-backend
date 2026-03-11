const documentService = require('./document.service');

exports.findAll = async (req, res, next) => {
    try {
        const result = await documentService.findAll(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const resource = await documentService.findById(req.params.id);
        res.json({ success: true, data: resource });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const resource = await documentService.create(req.body);
        res.status(201).json({ success: true, message: 'Document created', data: resource });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const resource = await documentService.update(req.params.id, req.body);
        res.json({ success: true, message: 'Document updated', data: resource });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        await documentService.delete(req.params.id);
        res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
        next(error);
    }
};
