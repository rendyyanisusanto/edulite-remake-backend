const express = require('express');
const router = express.Router();
const ctrl = require('./counseling_session.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

// Get case timeline
router.get('/cases/:caseId/timeline', permissionMiddleware('counseling_session.view'), ctrl.getCaseTimeline);

// By Case
router.get('/cases/:caseId', permissionMiddleware('counseling_session.view'), ctrl.findAllByCaseId);

// CRUD
router.get('/:id', permissionMiddleware('counseling_session.view'), ctrl.findById);
router.post('/', permissionMiddleware('counseling_session.create'), ctrl.create);
router.put('/:id', permissionMiddleware('counseling_session.update'), ctrl.update);
router.delete('/:id', permissionMiddleware('counseling_session.delete'), ctrl.delete);

module.exports = router;
