'use strict';
const svc = require('./attendance_shift.service');

exports.findAll = async (req, res, next) => { try { res.json({ success: true, data: await svc.findAll(req.query) }); } catch (e) { next(e); } };
exports.findAllActive = async (req, res, next) => { try { res.json({ success: true, data: await svc.findAllActive() }); } catch (e) { next(e); } };
exports.findById = async (req, res, next) => { try { res.json({ success: true, data: await svc.findById(req.params.id) }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.create(req.body) }); } catch (e) { next(e); } };
exports.update = async (req, res, next) => { try { res.json({ success: true, data: await svc.update(req.params.id, req.body) }); } catch (e) { next(e); } };
exports.toggleActive = async (req, res, next) => { try { res.json({ success: true, data: await svc.toggleActive(req.params.id) }); } catch (e) { next(e); } };
exports.delete = async (req, res, next) => { try { await svc.delete(req.params.id); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); } };
