'use strict';

const shiftService = require('./student_attendance_shift.service');

exports.listShifts = async (req, res, next) => {
    try {
        res.json({ success: true, data: await shiftService.listShifts(req.query) });
    } catch (error) {
        next(error);
    }
};

exports.getShiftDetail = async (req, res, next) => {
    try {
        res.json({ success: true, data: await shiftService.findShiftById(req.params.id) });
    } catch (error) {
        next(error);
    }
};

exports.createShift = async (req, res, next) => {
    try {
        res.status(201).json({ success: true, data: await shiftService.createShift(req.body, req.user) });
    } catch (error) {
        next(error);
    }
};

exports.updateShift = async (req, res, next) => {
    try {
        res.json({ success: true, data: await shiftService.updateShift(req.params.id, req.body, req.user) });
    } catch (error) {
        next(error);
    }
};

exports.toggleShiftActive = async (req, res, next) => {
    try {
        res.json({ success: true, data: await shiftService.toggleShiftActive(req.params.id, req.user) });
    } catch (error) {
        next(error);
    }
};

exports.listClassMappings = async (req, res, next) => {
    try {
        res.json({ success: true, data: await shiftService.listClassMappings(req.query) });
    } catch (error) {
        next(error);
    }
};

exports.upsertClassMapping = async (req, res, next) => {
    try {
        res.json({ success: true, data: await shiftService.upsertClassMapping(req.body, req.user) });
    } catch (error) {
        next(error);
    }
};

exports.updateClassMapping = async (req, res, next) => {
    try {
        res.json({ success: true, data: await shiftService.updateClassMapping(req.params.id, req.body, req.user) });
    } catch (error) {
        next(error);
    }
};

exports.deleteClassMapping = async (req, res, next) => {
    try {
        await shiftService.deleteClassMapping(req.params.id);
        res.json({ success: true, message: 'Mapping shift kelas berhasil dihapus' });
    } catch (error) {
        next(error);
    }
};

exports.listStudentOverrides = async (req, res, next) => {
    try {
        res.json({ success: true, data: await shiftService.listStudentOverrides(req.query) });
    } catch (error) {
        next(error);
    }
};

exports.upsertStudentOverride = async (req, res, next) => {
    try {
        res.json({ success: true, data: await shiftService.upsertStudentOverride(req.body, req.user) });
    } catch (error) {
        next(error);
    }
};

exports.updateStudentOverride = async (req, res, next) => {
    try {
        res.json({ success: true, data: await shiftService.updateStudentOverride(req.params.id, req.body, req.user) });
    } catch (error) {
        next(error);
    }
};

exports.deleteStudentOverride = async (req, res, next) => {
    try {
        await shiftService.deleteStudentOverride(req.params.id);
        res.json({ success: true, message: 'Override shift siswa berhasil dihapus' });
    } catch (error) {
        next(error);
    }
};

