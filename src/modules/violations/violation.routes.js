const express = require('express');
const router = express.Router();

const levelCtrl = require('./violation_level.controller');
const typeCtrl = require('./violation_type.controller');
const studentCtrl = require('./student_violation.controller');

const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

// Violation Levels
router.get('/levels', authMiddleware, permissionMiddleware('violation_level.view'), levelCtrl.findAll);
router.get('/levels/:id', authMiddleware, permissionMiddleware('violation_level.view'), levelCtrl.findById);
router.post('/levels', authMiddleware, permissionMiddleware('violation_level.create'), levelCtrl.create);
router.put('/levels/:id', authMiddleware, permissionMiddleware('violation_level.update'), levelCtrl.update);
router.delete('/levels/:id', authMiddleware, permissionMiddleware('violation_level.delete'), levelCtrl.delete);

// Violation Types
router.get('/types', authMiddleware, permissionMiddleware('violation_type.view'), typeCtrl.findAll);
router.get('/types/:id', authMiddleware, permissionMiddleware('violation_type.view'), typeCtrl.findById);
router.post('/types', authMiddleware, permissionMiddleware('violation_type.create'), typeCtrl.create);
router.put('/types/:id', authMiddleware, permissionMiddleware('violation_type.update'), typeCtrl.update);
router.delete('/types/:id', authMiddleware, permissionMiddleware('violation_type.delete'), typeCtrl.delete);

// Student Violations
router.get('/students', authMiddleware, permissionMiddleware('student_violation.view'), studentCtrl.findAll);
router.get('/students/:id', authMiddleware, permissionMiddleware('student_violation.view'), studentCtrl.findById);
router.post('/students', authMiddleware, permissionMiddleware('student_violation.create'), studentCtrl.create);
router.put('/students/:id', authMiddleware, permissionMiddleware('student_violation.update'), studentCtrl.update);
router.delete('/students/:id', authMiddleware, permissionMiddleware('student_violation.delete'), studentCtrl.delete);

module.exports = router;
