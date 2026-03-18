const express = require('express');
const router = express.Router();
const resultController = require('./achievement_result.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

router.get('/', permissionMiddleware('achievement_result.view'), resultController.findAll);
router.get('/:id', permissionMiddleware('achievement_result.view'), resultController.findById);
router.post('/', permissionMiddleware('achievement_result.create'), resultController.create);
router.put('/:id', permissionMiddleware('achievement_result.update'), resultController.update);
router.delete('/:id', permissionMiddleware('achievement_result.delete'), resultController.delete);

module.exports = router;
