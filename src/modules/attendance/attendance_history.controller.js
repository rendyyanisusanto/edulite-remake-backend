'use strict';
const svc = require('./attendance_history.service');

exports.findAll = async (req, res, next) => { try { res.json({ success: true, data: await svc.findAll(req.query) }); } catch (e) { next(e); } };
exports.findById = async (req, res, next) => { try { res.json({ success: true, data: await svc.findById(req.params.id) }); } catch (e) { next(e); } };
