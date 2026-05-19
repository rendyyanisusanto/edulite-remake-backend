'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('./student_item_receipt.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);
router.use(permissionMiddleware('student_item_deposit.print'));

router.get('/student-item-receipts/deposit/:deposit_id/preview', ctrl.depositPreview);
router.get('/student-item-receipts/deposit/:deposit_id/pdf', ctrl.depositPdf);
router.get('/student-item-receipts/loan/:loan_id/preview', ctrl.loanPreview);
router.get('/student-item-receipts/loan/:loan_id/pdf', ctrl.loanPdf);
router.get('/student-item-receipts/daily-return/:loan_id/preview', ctrl.dailyReturnPreview);
router.get('/student-item-receipts/daily-return/:loan_id/pdf', ctrl.dailyReturnPdf);
router.get('/student-item-receipts/final-return/:final_return_id/preview', ctrl.finalReturnPreview);
router.get('/student-item-receipts/final-return/:final_return_id/pdf', ctrl.finalReturnPdf);

module.exports = router;
