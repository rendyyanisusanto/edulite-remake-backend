'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('./permission.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.get('/grouped', authMiddleware, permissionMiddleware('permission.view'), ctrl.findAllGrouped);
router.get('/', authMiddleware, permissionMiddleware('permission.view'), ctrl.findAll);
router.get('/:id', authMiddleware, permissionMiddleware('permission.view'), ctrl.findById);
router.post('/', authMiddleware, permissionMiddleware('permission.create'), ctrl.create);
router.put('/:id', authMiddleware, permissionMiddleware('permission.update'), ctrl.update);

module.exports = router;
