const express = require('express');
const router = express.Router();
const participantController = require('./achievement_participant.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

router.get('/', permissionMiddleware('achievement_participant.view'), participantController.findAll);
router.get('/:id', permissionMiddleware('achievement_participant.view'), participantController.findById);
router.post('/', permissionMiddleware('achievement_participant.create'), participantController.create);
router.put('/:id', permissionMiddleware('achievement_participant.update'), participantController.update);
router.delete('/:id', permissionMiddleware('achievement_participant.delete'), participantController.delete);

module.exports = router;
