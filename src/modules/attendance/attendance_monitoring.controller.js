'use strict';
const svc = require('./attendance_monitoring.service');

exports.findByDate = async (req, res, next) => { try { res.json({ success: true, data: await svc.findByDate(req.query) }); } catch (e) { next(e); } };
exports.findById = async (req, res, next) => { try { res.json({ success: true, data: await svc.findById(req.params.id) }); } catch (e) { next(e); } };
exports.getSummaryByDate = async (req, res, next) => { try { res.json({ success: true, data: await svc.getSummaryByDate(req.query.date) }); } catch (e) { next(e); } };
