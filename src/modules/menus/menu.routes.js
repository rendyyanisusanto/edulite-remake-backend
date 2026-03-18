'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('./menu.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.get('/me', authMiddleware, ctrl.getMyMenus);
router.get('/', authMiddleware, permissionMiddleware('menu.view'), ctrl.findAll);
router.patch('/:id/status', authMiddleware, permissionMiddleware('menu.manage'), ctrl.toggleStatus);
router.patch('/:id/permission', authMiddleware, permissionMiddleware('menu.manage'), ctrl.updatePermission);

module.exports = router;
