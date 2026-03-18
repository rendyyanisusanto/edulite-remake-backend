const express = require('express');
const router = express.Router();

const positivePointTypeController = require('./positive_point_type.controller');
const studentPositivePointController = require('./student_positive_point.controller');

const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

// Protect all positive points routes with auth
router.use(authMiddleware);

// --- Positive Point Types ---
router.get('/types', permissionMiddleware('positive_point_type.view'), positivePointTypeController.findAll);
router.get('/types/:id', permissionMiddleware('positive_point_type.view'), positivePointTypeController.findById);
router.post('/types', permissionMiddleware('positive_point_type.create'), positivePointTypeController.create);
router.put('/types/:id', permissionMiddleware('positive_point_type.update'), positivePointTypeController.update);
router.delete('/types/:id', permissionMiddleware('positive_point_type.delete'), positivePointTypeController.delete);

// --- Student Positive Points ---
router.get('/student-points', permissionMiddleware('student_positive_point.view'), studentPositivePointController.findAll);
router.get('/student-points/:id', permissionMiddleware('student_positive_point.view'), studentPositivePointController.findById);
router.post('/student-points', permissionMiddleware('student_positive_point.create'), studentPositivePointController.create);
router.put('/student-points/:id', permissionMiddleware('student_positive_point.update'), studentPositivePointController.update);
router.delete('/student-points/:id', permissionMiddleware('student_positive_point.delete'), studentPositivePointController.delete);

module.exports = router;
