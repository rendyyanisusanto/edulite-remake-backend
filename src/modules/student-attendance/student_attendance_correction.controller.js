'use strict';

const correctionService = require('./student_attendance_correction.service');

exports.findAll = async (req, res, next) => {
    try {
        res.json({ success: true, data: await correctionService.findAll(req.query) });
    } catch (error) {
        next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        res.json({ success: true, data: await correctionService.findById(req.params.id) });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        res.status(201).json({ success: true, data: await correctionService.create(req.body) });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        res.json({ success: true, data: await correctionService.update(req.params.id, req.body) });
    } catch (error) {
        next(error);
    }
};

exports.review = async (req, res, next) => {
    try {
        res.json({ success: true, data: await correctionService.review(req.params.id, req.body, req.user) });
    } catch (error) {
        next(error);
    }
};

