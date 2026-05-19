'use strict';

const express = require('express');
const router = express.Router();

const ctrl = require('./extracurricular.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);
router.use(permissionMiddleware('extracurricular.my.view'));

router.get('/', ctrl.getMyExtracurricular);
router.get('/sessions/today', ctrl.getMyTodaySessions);
router.get('/attendances', ctrl.getMyAttendances);
router.get('/progress', ctrl.getMyProgress);
router.get('/:id/progress-aspects', ctrl.getMyProgressAspects);
router.get('/:id/students/:studentId/progress', ctrl.getMyStudentProgress);
router.get('/:id', ctrl.getMyExtracurricularDetail);
router.get('/:id/schedules', ctrl.getMySchedules);
router.get('/:id/members', ctrl.getMyMembers);

module.exports = router;
