const express = require('express');
const router = express.Router();
const achievementController = require('./achievement.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

router.get('/', permissionMiddleware('achievement.view'), achievementController.findAll);
router.get('/:id', permissionMiddleware('achievement.view'), achievementController.findById);
router.post('/', permissionMiddleware('achievement.create'), achievementController.create);
router.put('/:id', permissionMiddleware('achievement.update'), achievementController.update);
router.delete('/:id', permissionMiddleware('achievement.delete'), achievementController.delete);

module.exports = router;
