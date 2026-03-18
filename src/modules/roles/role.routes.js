'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('./role.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.get('/', authMiddleware, permissionMiddleware('role.view'), ctrl.findAll);
router.get('/:id', authMiddleware, permissionMiddleware('role.view'), ctrl.findById);
router.post('/', authMiddleware, permissionMiddleware('role.create'), ctrl.create);
router.put('/:id', authMiddleware, permissionMiddleware('role.update'), ctrl.update);
router.delete('/:id', authMiddleware, permissionMiddleware('role.delete'), ctrl.delete);
router.get('/:id/permissions', authMiddleware, permissionMiddleware('role.view'), ctrl.getPermissions);
router.put('/:id/permissions', authMiddleware, permissionMiddleware('role.assign_permission'), ctrl.syncPermissions);

module.exports = router;
