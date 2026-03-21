const express = require('express');
const router = express.Router();
const classSetupController = require('./class_setup.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

router.get('/summary', permissionMiddleware('class_assignment.view'), classSetupController.getSummary);
router.get('/classes', permissionMiddleware('class_assignment.view'), classSetupController.getClasses);
router.get('/unassigned-students', permissionMiddleware('class_assignment.view'), classSetupController.getUnassignedStudents);

router.post('/assign', permissionMiddleware('class_assignment.bulk_assign'), classSetupController.bulkAssign);
router.post('/move', permissionMiddleware('class_assignment.bulk_move'), classSetupController.bulkMove);

router.delete('/assignment/:history_id', permissionMiddleware('class_assignment.delete'), classSetupController.removeAssignment);

module.exports = router;
