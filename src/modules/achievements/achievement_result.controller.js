const resultService = require('./achievement_result.service');

exports.findAll = async (req, res, next) => {
    try {
        const result = await resultService.findAll(req.query);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const item = await resultService.findById(req.params.id);
        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const item = await resultService.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Result added successfully',
            data: item
        });
    } catch (error) {
        // Pass specifically if it's our error message
        if (error.message === 'Participant already has a result recorded') {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const item = await resultService.update(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Result updated successfully',
            data: item
        });
    } catch (error) {
        if (error.message === 'Target participant already has a result recorded') {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        await resultService.delete(req.params.id);
        res.json({
            success: true,
            message: 'Result removed successfully'
        });
    } catch (error) {
        next(error);
    }
};
