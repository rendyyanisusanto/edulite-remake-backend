'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('./cbt_master_teacher_assignment.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.get('/', authMiddleware, permissionMiddleware('cbt.master.teacher_assignment.view'), ctrl.findAll);
router.get('/:id', authMiddleware, permissionMiddleware('cbt.master.teacher_assignment.view'), ctrl.findById);
router.post('/', authMiddleware, permissionMiddleware('cbt.master.teacher_assignment.create'), ctrl.create);
router.put('/:id', authMiddleware, permissionMiddleware('cbt.master.teacher_assignment.update'), ctrl.update);
router.patch('/:id/status', authMiddleware, permissionMiddleware('cbt.master.teacher_assignment.update'), ctrl.updateStatus);
router.delete('/:id', authMiddleware, permissionMiddleware('cbt.master.teacher_assignment.delete'), ctrl.delete);

module.exports = router;
