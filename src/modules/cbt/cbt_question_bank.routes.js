'use strict';
const express = require('express');
const router = express.Router();
const controller = require('./cbt_question_bank.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

// Endpoint daftar Bank Soal, butuh permission .view atau .view_all (dihandle di controller untuk filter view_all)
// Namun user perlu setidaknya cbt.question_bank.view
router.get('/', permissionMiddleware('cbt.question_bank.view'), controller.findAll);

// Membuat Bank Soal
router.post('/', permissionMiddleware('cbt.question_bank.create'), controller.create);

// Mendapatkan detail Bank Soal 
router.get('/:id', permissionMiddleware('cbt.question_bank.view'), controller.findOne);

// Update Bank Soal
router.put('/:id', permissionMiddleware('cbt.question_bank.update'), controller.update);

// Update status (Aktif/Arsip)
router.patch('/:id/status', permissionMiddleware('cbt.question_bank.archive'), controller.updateStatus);

// Delete Bank Soal
router.delete('/:id', permissionMiddleware('cbt.question_bank.archive'), controller.remove);

module.exports = router;
