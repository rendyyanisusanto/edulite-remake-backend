'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('./cbt_master_student_account.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.get('/', authMiddleware, permissionMiddleware('cbt.master.student_account.view'), ctrl.findAll);
router.post('/', authMiddleware, permissionMiddleware('cbt.master.student_account.create'), ctrl.createSingle);
router.post('/bulk', authMiddleware, permissionMiddleware('cbt.master.student_account.create'), ctrl.createBulk);
router.patch('/:id/status', authMiddleware, permissionMiddleware('cbt.master.student_account.change_status'), ctrl.updateStatus);
router.post('/:id/reset-password', authMiddleware, permissionMiddleware('cbt.master.student_account.reset_password'), ctrl.resetPassword);

module.exports = router;
