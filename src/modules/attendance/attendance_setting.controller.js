'use strict';
const svc = require('./attendance_setting.service');

exports.getCurrent = async (req, res, next) => { try { res.json({ success: true, data: await svc.getCurrent() }); } catch (e) { next(e); } };
exports.upsert = async (req, res, next) => { try { res.json({ success: true, data: await svc.upsert(req.body, req.user.id) }); } catch (e) { next(e); } };
