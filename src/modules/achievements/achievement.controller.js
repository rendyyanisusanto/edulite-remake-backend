const achievementService = require('./achievement.service');

exports.findAll = async (req, res, next) => {
    try {
        const result = await achievementService.findAll(req.query);
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
        const item = await achievementService.findById(req.params.id);
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
        // Add user info
        const data = { ...req.body, created_by: req.user?.id, updated_by: req.user?.id };
        const item = await achievementService.create(data);
        res.status(201).json({
            success: true,
            message: 'Achievement created successfully',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const data = { ...req.body, updated_by: req.user?.id };
        const item = await achievementService.update(req.params.id, data);
        res.json({
            success: true,
            message: 'Achievement updated successfully',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        await achievementService.delete(req.params.id);
        res.json({
            success: true,
            message: 'Achievement deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
