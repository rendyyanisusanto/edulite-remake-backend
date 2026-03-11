const participantService = require('./achievement_participant.service');

exports.findAll = async (req, res, next) => {
    try {
        const result = await participantService.findAll(req.query);
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
        const item = await participantService.findById(req.params.id);
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
        const item = await participantService.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Participant added successfully',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const item = await participantService.update(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Participant updated successfully',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        await participantService.delete(req.params.id);
        res.json({
            success: true,
            message: 'Participant removed successfully'
        });
    } catch (error) {
        next(error);
    }
};
