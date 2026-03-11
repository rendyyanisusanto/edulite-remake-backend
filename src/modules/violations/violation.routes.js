const express = require('express');
const router = express.Router();

const levelCtrl = require('./violation_level.controller');
const typeCtrl = require('./violation_type.controller');
const studentCtrl = require('./student_violation.controller');

const { authMiddleware } = require('../../core/middleware/auth.middleware');

// Violation Levels
router.get('/levels', authMiddleware, levelCtrl.findAll);
router.get('/levels/:id', authMiddleware, levelCtrl.findById);
router.post('/levels', authMiddleware, levelCtrl.create);
router.put('/levels/:id', authMiddleware, levelCtrl.update);
router.delete('/levels/:id', authMiddleware, levelCtrl.delete);

// Violation Types
router.get('/types', authMiddleware, typeCtrl.findAll);
router.get('/types/:id', authMiddleware, typeCtrl.findById);
router.post('/types', authMiddleware, typeCtrl.create);
router.put('/types/:id', authMiddleware, typeCtrl.update);
router.delete('/types/:id', authMiddleware, typeCtrl.delete);

// Student Violations
router.get('/students', authMiddleware, studentCtrl.findAll);
router.get('/students/:id', authMiddleware, studentCtrl.findById);
router.post('/students', authMiddleware, studentCtrl.create);
router.put('/students/:id', authMiddleware, studentCtrl.update);
router.delete('/students/:id', authMiddleware, studentCtrl.delete);

module.exports = router;
