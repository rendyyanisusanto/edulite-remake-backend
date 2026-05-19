'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('./student_item_report.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

router.get('/student-item-reports/summary', permissionMiddleware('student_item_deposit.report.view'), ctrl.summary);
router.get('/student-item-reports/active-items', permissionMiddleware('student_item_deposit.report.view'), ctrl.activeItems);
router.get('/student-item-reports/daily-loans', permissionMiddleware('student_item_deposit.report.view'), ctrl.dailyLoans);
router.get('/student-item-reports/unreturned-items', permissionMiddleware('student_item_deposit.report.view'), ctrl.unreturnedItems);
router.get('/student-item-reports/final-returns', permissionMiddleware('student_item_deposit.report.view'), ctrl.finalReturns);
router.get('/student-item-reports/problem-items', permissionMiddleware('student_item_deposit.report.view'), ctrl.problemItems);
router.get('/student-item-reports/student-behavior', permissionMiddleware('student_item_deposit.report.view'), ctrl.studentBehavior);
router.get('/student-item-reports/class-summary', permissionMiddleware('student_item_deposit.report.view'), ctrl.classSummary);
router.get('/student-item-reports/student-history/:student_id', permissionMiddleware('student_item_deposit.report.view'), ctrl.studentHistory);

router.get('/student-item-reports/active-items/preview', permissionMiddleware('student_item_deposit.report.view'), ctrl.activeItemsPreview);
router.get('/student-item-reports/daily-loans/preview', permissionMiddleware('student_item_deposit.report.view'), ctrl.dailyLoansPreview);
router.get('/student-item-reports/unreturned-items/preview', permissionMiddleware('student_item_deposit.report.view'), ctrl.unreturnedItemsPreview);
router.get('/student-item-reports/final-returns/preview', permissionMiddleware('student_item_deposit.report.view'), ctrl.finalReturnsPreview);
router.get('/student-item-reports/problem-items/preview', permissionMiddleware('student_item_deposit.report.view'), ctrl.problemItemsPreview);
router.get('/student-item-reports/student-behavior/preview', permissionMiddleware('student_item_deposit.report.view'), ctrl.studentBehaviorPreview);
router.get('/student-item-reports/class-summary/preview', permissionMiddleware('student_item_deposit.report.view'), ctrl.classSummaryPreview);
router.get('/student-item-reports/student-history/:student_id/preview', permissionMiddleware('student_item_deposit.report.view'), ctrl.studentHistoryPreview);

router.get('/student-item-reports/active-items/pdf', permissionMiddleware('student_item_deposit.report.export'), ctrl.activeItemsPdf);
router.get('/student-item-reports/daily-loans/pdf', permissionMiddleware('student_item_deposit.report.export'), ctrl.dailyLoansPdf);
router.get('/student-item-reports/unreturned-items/pdf', permissionMiddleware('student_item_deposit.report.export'), ctrl.unreturnedItemsPdf);
router.get('/student-item-reports/final-returns/pdf', permissionMiddleware('student_item_deposit.report.export'), ctrl.finalReturnsPdf);
router.get('/student-item-reports/problem-items/pdf', permissionMiddleware('student_item_deposit.report.export'), ctrl.problemItemsPdf);
router.get('/student-item-reports/student-behavior/pdf', permissionMiddleware('student_item_deposit.report.export'), ctrl.studentBehaviorPdf);
router.get('/student-item-reports/class-summary/pdf', permissionMiddleware('student_item_deposit.report.export'), ctrl.classSummaryPdf);
router.get('/student-item-reports/student-history/:student_id/pdf', permissionMiddleware('student_item_deposit.report.export'), ctrl.studentHistoryPdf);

module.exports = router;
