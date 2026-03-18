const express = require('express');
const router = express.Router();

const academicYearController = require('./academic_year.controller');
const gradeController = require('./grade.controller');
const departmentController = require('./department.controller');
const classController = require('./class.controller');
const teacherController = require('./teacher.controller');

const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

// Prefix: /api/academic

// Academic Years
router.get('/years', authMiddleware, permissionMiddleware('academic_year.view'), academicYearController.findAll);
router.get('/years/:id', authMiddleware, permissionMiddleware('academic_year.view'), academicYearController.findById);
router.post('/years', authMiddleware, permissionMiddleware('academic_year.create'), academicYearController.create);
router.put('/years/:id', authMiddleware, permissionMiddleware('academic_year.update'), academicYearController.update);
router.delete('/years/:id', authMiddleware, permissionMiddleware('academic_year.delete'), academicYearController.delete);

// Grades
router.get('/grades', authMiddleware, permissionMiddleware('grade.view'), gradeController.findAll);
router.get('/grades/:id', authMiddleware, permissionMiddleware('grade.view'), gradeController.findById);
router.post('/grades', authMiddleware, permissionMiddleware('grade.create'), gradeController.create);
router.put('/grades/:id', authMiddleware, permissionMiddleware('grade.update'), gradeController.update);
router.delete('/grades/:id', authMiddleware, permissionMiddleware('grade.delete'), gradeController.delete);

// Departments
router.get('/departments', authMiddleware, permissionMiddleware('department.view'), departmentController.findAll);
router.get('/departments/:id', authMiddleware, permissionMiddleware('department.view'), departmentController.findById);
router.post('/departments', authMiddleware, permissionMiddleware('department.create'), departmentController.create);
router.put('/departments/:id', authMiddleware, permissionMiddleware('department.update'), departmentController.update);
router.delete('/departments/:id', authMiddleware, permissionMiddleware('department.delete'), departmentController.delete);

// Classes
router.get('/classes', authMiddleware, permissionMiddleware('class.view'), classController.findAll);
router.get('/classes/:id', authMiddleware, permissionMiddleware('class.view'), classController.findById);
router.post('/classes', authMiddleware, permissionMiddleware('class.create'), classController.create);
router.put('/classes/:id', authMiddleware, permissionMiddleware('class.update'), classController.update);
router.delete('/classes/:id', authMiddleware, permissionMiddleware('class.delete'), classController.delete);

// Teachers
router.get('/teachers', authMiddleware, permissionMiddleware('teacher.view'), teacherController.findAll);
router.get('/teachers/:id', authMiddleware, permissionMiddleware('teacher.view'), teacherController.findById);
router.post('/teachers', authMiddleware, permissionMiddleware('teacher.create'), teacherController.create);
router.put('/teachers/:id', authMiddleware, permissionMiddleware('teacher.update'), teacherController.update);
router.delete('/teachers/:id', authMiddleware, permissionMiddleware('teacher.delete'), teacherController.delete);

module.exports = router;
