const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

const academicYearController = require('./academic_year.controller');
const gradeController = require('./grade.controller');
const departmentController = require('./department.controller');
const classController = require('./class.controller');
const teacherController = require('./teacher.controller');
const subjectController = require('./subject.controller');
const lessonPeriodController = require('./lesson_period.controller');

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
router.get('/classes', authMiddleware, classController.findAll);
router.get('/classes/:id', authMiddleware, permissionMiddleware('class.view'), classController.findById);
router.post('/classes', authMiddleware, permissionMiddleware('class.create'), classController.create);
router.put('/classes/:id', authMiddleware, permissionMiddleware('class.update'), classController.update);
router.delete('/classes/:id', authMiddleware, permissionMiddleware('class.delete'), classController.delete);

// Teachers
router.get('/teachers', authMiddleware, permissionMiddleware('teacher.view'), teacherController.findAll);
router.get('/teachers/:id', authMiddleware, permissionMiddleware('teacher.view'), teacherController.findById);
router.post('/teachers', authMiddleware, permissionMiddleware('teacher.create'), teacherController.create);
router.put('/teachers/:id', authMiddleware, permissionMiddleware('teacher.update'), teacherController.update);
router.post('/teachers/:id/photo', authMiddleware, permissionMiddleware('teacher.update'), upload.single('photo'), teacherController.uploadPhoto);
router.delete('/teachers/:id', authMiddleware, permissionMiddleware('teacher.delete'), teacherController.delete);

// Subjects
router.get('/subjects', authMiddleware, permissionMiddleware('subject.view'), subjectController.findAll);
router.get('/subjects/:id', authMiddleware, permissionMiddleware('subject.view'), subjectController.findById);
router.post('/subjects', authMiddleware, permissionMiddleware('subject.create'), subjectController.create);
router.put('/subjects/:id', authMiddleware, permissionMiddleware('subject.update'), subjectController.update);
router.patch('/subjects/:id/toggle', authMiddleware, permissionMiddleware('subject.toggle_active'), subjectController.toggleActive);
router.delete('/subjects/:id', authMiddleware, permissionMiddleware('subject.delete'), subjectController.delete);

// Lesson Period Templates
router.get('/lesson-period-templates', authMiddleware, permissionMiddleware('lesson_period_template.view'), lessonPeriodController.listTemplates);
router.get('/lesson-period-templates/:id', authMiddleware, permissionMiddleware('lesson_period_template.view'), lessonPeriodController.findTemplateById);
router.post('/lesson-period-templates', authMiddleware, permissionMiddleware('lesson_period_template.create'), lessonPeriodController.createTemplate);
router.put('/lesson-period-templates/:id', authMiddleware, permissionMiddleware('lesson_period_template.update'), lessonPeriodController.updateTemplate);
router.patch('/lesson-period-templates/:id/default', authMiddleware, permissionMiddleware('lesson_period_template.update'), lessonPeriodController.setTemplateDefault);
router.patch('/lesson-period-templates/:id/toggle', authMiddleware, permissionMiddleware('lesson_period_template.toggle_active'), lessonPeriodController.toggleTemplateActive);

// Lesson Period Details
router.get('/lesson-period-templates/:templateId/periods', authMiddleware, permissionMiddleware('lesson_period.view'), lessonPeriodController.listPeriodsByTemplate);
router.post('/lesson-periods', authMiddleware, permissionMiddleware('lesson_period.create'), lessonPeriodController.createPeriod);
router.put('/lesson-periods/:id', authMiddleware, permissionMiddleware('lesson_period.update'), lessonPeriodController.updatePeriod);
router.patch('/lesson-periods/:id/toggle', authMiddleware, permissionMiddleware('lesson_period.toggle_active'), lessonPeriodController.togglePeriodActive);
router.delete('/lesson-periods/:id', authMiddleware, permissionMiddleware('lesson_period.delete'), lessonPeriodController.deletePeriod);

module.exports = router;
