const express = require('express');
const router = express.Router();
const ctrl = require('./counseling_case.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

// Stats (must be before /:id to avoid conflict)
router.get('/stats', permissionMiddleware('counseling_case.view'), ctrl.getStats);
router.get('/follow-up/all', permissionMiddleware('counseling_follow_up.view'), ctrl.getFollowups);

// Student history
router.get('/student/:studentId', permissionMiddleware('counseling_case.view'), ctrl.findByStudentId);

// CRUD
router.get('/', permissionMiddleware('counseling_case.view'), ctrl.findAll);
router.get('/:id', permissionMiddleware('counseling_case.view'), ctrl.findById);
router.post('/', permissionMiddleware('counseling_case.create'), ctrl.create);
router.put('/:id', permissionMiddleware('counseling_case.update'), ctrl.update);
router.patch('/:id/status', permissionMiddleware('counseling_case.change_status'), ctrl.updateStatus);
router.delete('/:id', permissionMiddleware('counseling_case.delete'), ctrl.delete);

module.exports = router;
