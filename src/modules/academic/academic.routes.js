const express = require('express');
const router = express.Router();

const academicYearController = require('./academic_year.controller');
const gradeController = require('./grade.controller');
const departmentController = require('./department.controller');
const classController = require('./class.controller');
const teacherController = require('./teacher.controller');

const { authMiddleware } = require('../../core/middleware/auth.middleware');

// Prefix: /api/academic

// Academic Years
router.get('/years', authMiddleware, academicYearController.findAll);
router.get('/years/:id', authMiddleware, academicYearController.findById);
router.post('/years', authMiddleware, academicYearController.create);
router.put('/years/:id', authMiddleware, academicYearController.update);
router.delete('/years/:id', authMiddleware, academicYearController.delete);

// Grades
router.get('/grades', authMiddleware, gradeController.findAll);
router.get('/grades/:id', authMiddleware, gradeController.findById);
router.post('/grades', authMiddleware, gradeController.create);
router.put('/grades/:id', authMiddleware, gradeController.update);
router.delete('/grades/:id', authMiddleware, gradeController.delete);

// Departments
router.get('/departments', authMiddleware, departmentController.findAll);
router.get('/departments/:id', authMiddleware, departmentController.findById);
router.post('/departments', authMiddleware, departmentController.create);
router.put('/departments/:id', authMiddleware, departmentController.update);
router.delete('/departments/:id', authMiddleware, departmentController.delete);

// Classes
router.get('/classes', authMiddleware, classController.findAll);
router.get('/classes/:id', authMiddleware, classController.findById);
router.post('/classes', authMiddleware, classController.create);
router.put('/classes/:id', authMiddleware, classController.update);
router.delete('/classes/:id', authMiddleware, classController.delete);

// Teachers
router.get('/teachers', authMiddleware, teacherController.findAll);
router.get('/teachers/:id', authMiddleware, teacherController.findById);
router.post('/teachers', authMiddleware, teacherController.create);
router.put('/teachers/:id', authMiddleware, teacherController.update);
router.delete('/teachers/:id', authMiddleware, teacherController.delete);

module.exports = router;
