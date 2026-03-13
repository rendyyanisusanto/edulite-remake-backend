const express = require('express');
const router = express.Router();

const positivePointTypeController = require('./positive_point_type.controller');
const studentPositivePointController = require('./student_positive_point.controller');

const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

// Protect all positive points routes with auth
router.use(authMiddleware);

// --- Positive Point Types ---
router.get('/types', permissionMiddleware('positive_points.view'), positivePointTypeController.findAll);
router.get('/types/:id', permissionMiddleware('positive_points.view'), positivePointTypeController.findById);
router.post('/types', permissionMiddleware('positive_points.create'), positivePointTypeController.create);
router.put('/types/:id', permissionMiddleware('positive_points.update'), positivePointTypeController.update);
router.delete('/types/:id', permissionMiddleware('positive_points.delete'), positivePointTypeController.delete);

// --- Student Positive Points ---
router.get('/student-points', permissionMiddleware('positive_points.view'), studentPositivePointController.findAll);
router.get('/student-points/:id', permissionMiddleware('positive_points.view'), studentPositivePointController.findById);
router.post('/student-points', permissionMiddleware('positive_points.create'), studentPositivePointController.create);
router.put('/student-points/:id', permissionMiddleware('positive_points.update'), studentPositivePointController.update);
router.delete('/student-points/:id', permissionMiddleware('positive_points.delete'), studentPositivePointController.delete);

module.exports = router;
