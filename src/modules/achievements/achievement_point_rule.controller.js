const pointRuleService = require('./achievement_point_rule.service');

exports.findAll = async (req, res, next) => {
    try {
        const result = await pointRuleService.getAll(req.query);
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
        const result = await pointRuleService.getById(req.params.id);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const result = await pointRuleService.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Point rule created successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const result = await pointRuleService.update(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Point rule updated successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        await pointRuleService.delete(req.params.id);
        res.json({
            success: true,
            message: 'Point rule deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
