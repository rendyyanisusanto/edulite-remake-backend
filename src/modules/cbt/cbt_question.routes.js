'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true }); // Important: to access :bankId from parent router if nested
const controller = require('./cbt_question.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

// Endpoint daftar Soal dalam suatu Bank Soal
router.get('/', permissionMiddleware('cbt.question.view'), controller.findAll);

// Endpoint detail satu Soal
router.get('/:id', permissionMiddleware('cbt.question.view'), controller.findOne);

// Membuat Soal baru
router.post('/', permissionMiddleware('cbt.question.create'), controller.create);

// Update Soal
router.put('/:id', permissionMiddleware('cbt.question.update'), controller.update);

// Update status Soal (Activate / Archive)
router.patch('/:id/status', permissionMiddleware('cbt.question.archive'), controller.updateStatus);

// Duplicate Soal
router.post('/:id/duplicate', permissionMiddleware('cbt.question.duplicate'), controller.duplicate);

module.exports = router;
