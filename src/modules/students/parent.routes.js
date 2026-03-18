const express = require('express');
const router = express.Router();
const parentController = require('./parent.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

router.get('/', permissionMiddleware('parent.view'), parentController.findAll);
router.get('/:id', permissionMiddleware('parent.view'), parentController.findById);
router.post('/', permissionMiddleware('parent.create'), parentController.create);
router.put('/:id', permissionMiddleware('parent.update'), parentController.update);
router.delete('/:id', permissionMiddleware('parent.delete'), parentController.delete);

module.exports = router;
