'use strict';

const queryService = require('./student_toilet_query.service');

exports.getToday = async (req, res, next) => {
    try {
        res.json({ success: true, data: await queryService.findToday(req.query) });
    } catch (error) {
        next(error);
    }
};

exports.getHistory = async (req, res, next) => {
    try {
        res.json({ success: true, data: await queryService.findAll(req.query) });
    } catch (error) {
        next(error);
    }
};

exports.getSummary = async (req, res, next) => {
    try {
        res.json({ success: true, data: await queryService.getSummary(req.query) });
    } catch (error) {
        next(error);
    }
};

exports.getTodayScanLogs = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 50;
        res.json({ success: true, data: await queryService.getTodayScanLogs(limit) });
    } catch (error) {
        next(error);
    }
};

