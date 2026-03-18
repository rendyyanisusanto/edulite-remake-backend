'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('./user.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.get('/me/permissions', authMiddleware, ctrl.getMyPermissions);
router.get('/', authMiddleware, permissionMiddleware('user.view'), ctrl.findAll);
router.get('/:id', authMiddleware, permissionMiddleware('user.view'), ctrl.findById);
router.post('/', authMiddleware, permissionMiddleware('user.create'), ctrl.create);
router.put('/:id', authMiddleware, permissionMiddleware('user.update'), ctrl.update);
router.put('/:id/roles', authMiddleware, permissionMiddleware('user.assign_role'), ctrl.syncRoles);
router.patch('/:id/reset-password', authMiddleware, permissionMiddleware('user.reset_password'), ctrl.resetPassword);
router.patch('/:id/status', authMiddleware, permissionMiddleware('user.update'), ctrl.toggleStatus);

module.exports = router;
