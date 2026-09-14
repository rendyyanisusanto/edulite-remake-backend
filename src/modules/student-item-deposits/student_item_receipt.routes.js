'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('./student_item_receipt.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

router.get('/student-item-receipts/deposit/:deposit_id/preview', permissionMiddleware('student_item_deposit.print'), ctrl.depositPreview);
router.get('/student-item-receipts/deposit/:deposit_id/pdf', permissionMiddleware('student_item_deposit.print'), ctrl.depositPdf);
router.get('/student-item-receipts/loan/:loan_id/preview', permissionMiddleware('student_item_deposit.print'), ctrl.loanPreview);
router.get('/student-item-receipts/loan/:loan_id/pdf', permissionMiddleware('student_item_deposit.print'), ctrl.loanPdf);
router.get('/student-item-receipts/daily-return/:loan_id/preview', permissionMiddleware('student_item_deposit.print'), ctrl.dailyReturnPreview);
router.get('/student-item-receipts/daily-return/:loan_id/pdf', permissionMiddleware('student_item_deposit.print'), ctrl.dailyReturnPdf);
router.get('/student-item-receipts/final-return/:final_return_id/preview', permissionMiddleware('student_item_deposit.print'), ctrl.finalReturnPreview);
router.get('/student-item-receipts/final-return/:final_return_id/pdf', permissionMiddleware('student_item_deposit.print'), ctrl.finalReturnPdf);

module.exports = router;
