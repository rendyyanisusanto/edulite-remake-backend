const lessonPeriodService = require('./lesson_period.service');

exports.listTemplates = async (req, res, next) => {
    try {
        const result = await lessonPeriodService.listTemplates(req.query);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.findTemplateById = async (req, res, next) => {
    try {
        const result = await lessonPeriodService.findTemplateById(req.params.id);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.createTemplate = async (req, res, next) => {
    try {
        const result = await lessonPeriodService.createTemplate(req.body, req.user);
        res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.updateTemplate = async (req, res, next) => {
    try {
        const result = await lessonPeriodService.updateTemplate(req.params.id, req.body, req.user);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.setTemplateDefault = async (req, res, next) => {
    try {
        const result = await lessonPeriodService.setTemplateDefault(req.params.id, req.user);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.toggleTemplateActive = async (req, res, next) => {
    try {
        const result = await lessonPeriodService.toggleTemplateActive(req.params.id, req.user);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.listPeriodsByTemplate = async (req, res, next) => {
    try {
        const result = await lessonPeriodService.listPeriodsByTemplate(req.params.templateId);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.createPeriod = async (req, res, next) => {
    try {
        const result = await lessonPeriodService.createPeriod(req.body, req.user);
        res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.updatePeriod = async (req, res, next) => {
    try {
        const result = await lessonPeriodService.updatePeriod(req.params.id, req.body, req.user);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.togglePeriodActive = async (req, res, next) => {
    try {
        const result = await lessonPeriodService.togglePeriodActive(req.params.id, req.user);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
};

exports.deletePeriod = async (req, res, next) => {
    try {
        await lessonPeriodService.deletePeriod(req.params.id);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) { next(err); }
};

