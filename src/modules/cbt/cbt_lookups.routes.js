'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('./cbt_lookups.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');

router.use(authMiddleware);

router.get('/teachers', ctrl.getTeachers);
router.get('/subjects', ctrl.getSubjects);
router.get('/academic-years', ctrl.getAcademicYears);
router.get('/grades', ctrl.getGrades);
router.get('/departments', ctrl.getDepartments);
router.get('/classes', ctrl.getClasses);

module.exports = router;
