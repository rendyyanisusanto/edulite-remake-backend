'use strict';

const express = require('express');
const multer = require('multer');
const ctrl = require('./student_item_deposit.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

const router = express.Router();
const kioskRouter = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const kioskAuth = (req, res, next) => {
    const rawConfiguredToken = process.env.KIOSK_INTERNAL_TOKEN || process.env.VITE_KIOSK_INTERNAL_TOKEN || '';
    const configuredToken = String(rawConfiguredToken).trim();
    const tokenFromHeader = String(req.headers['x-kiosk-token'] || '').trim();
    const tokenFromBody = String((req.body && req.body.kiosk_token) || '').trim();
    const tokenFromQuery = String((req.query && req.query.kiosk_token) || '').trim();
    const token = tokenFromHeader || tokenFromBody || tokenFromQuery;

    // Public-internal kiosk mode:
    // - If token is configured AND token is provided, enforce exact match.
    // - If token is not provided, allow request (to avoid auth fallback blocking kiosk devices).
    if (configuredToken.length > 0 && token && token !== configuredToken) {
        return res.status(401).json({ success: false, message: 'Unauthorized kiosk token', error_code: 'UNAUTHORIZED' });
    }
    return next();
};

router.use(authMiddleware);

router.get('/student-item-categories', permissionMiddleware('student_item_deposit.view'), ctrl.getCategories);
router.post('/student-item-categories', permissionMiddleware('student_item_deposit.category.manage'), ctrl.createCategory);
router.get('/student-item-categories/:id', permissionMiddleware('student_item_deposit.view'), ctrl.getCategoryById);
router.put('/student-item-categories/:id', permissionMiddleware('student_item_deposit.category.manage'), ctrl.updateCategory);
router.delete('/student-item-categories/:id', permissionMiddleware('student_item_deposit.category.manage'), ctrl.deleteCategory);

router.get('/student-item-deposits-dashboard', permissionMiddleware('student_item_deposit.view'), ctrl.getDashboard);
router.get('/student-item-deposit-settings', permissionMiddleware('student_item_deposit.view'), ctrl.getSetting);
router.put('/student-item-deposit-settings/:id', permissionMiddleware('student_item_deposit.setting.manage'), ctrl.updateSetting);

router.get('/student-item-loans', permissionMiddleware('student_item_deposit.view'), ctrl.getLoans);
router.get('/student-item-loans/active', permissionMiddleware('student_item_deposit.view'), ctrl.getActiveLoans);
router.get('/student-item-loans/overdue', permissionMiddleware('student_item_deposit.view'), ctrl.getOverdueLoans);

router.get('/student-item-deposits', permissionMiddleware('student_item_deposit.view'), ctrl.getDeposits);
router.post('/student-item-deposits', permissionMiddleware('student_item_deposit.create'), upload.single('photo_in'), ctrl.createDeposit);
router.get('/student-item-deposits/:id', permissionMiddleware('student_item_deposit.view'), ctrl.getDepositById);
router.put('/student-item-deposits/:id', permissionMiddleware('student_item_deposit.update'), upload.single('photo_in'), ctrl.updateDeposit);
router.get('/student-item-deposits/:id/logs', permissionMiddleware('student_item_deposit.view'), ctrl.getLogs);
router.get('/student-item-deposits/:id/print-preview', permissionMiddleware('student_item_deposit.print'), ctrl.printPreview);
router.get('/student-item-deposits/:id/print', permissionMiddleware('student_item_deposit.print'), ctrl.print);

router.post('/student-item-deposits/:id/loan', permissionMiddleware('student_item_deposit.loan'), ctrl.loanDeposit);
router.post('/student-item-deposits/:id/return-daily', permissionMiddleware('student_item_deposit.return_daily'), ctrl.returnDaily);
router.post('/student-item-deposits/:id/final-return', permissionMiddleware('student_item_deposit.final_return'), upload.single('photo_out'), ctrl.finalReturn);
router.post('/student-item-deposits/:id/cancel', permissionMiddleware('student_item_deposit.cancel'), ctrl.cancelDeposit);
router.post('/student-item-deposits/:id/mark-lost', permissionMiddleware('student_item_deposit.update'), ctrl.markLost);
router.post('/student-item-deposits/:id/mark-damaged', permissionMiddleware('student_item_deposit.update'), ctrl.markDamaged);

kioskRouter.post('/kiosk/student-item-deposits/rfid-scan', kioskAuth, ctrl.kioskRfidScan);
kioskRouter.post('/kiosk/student-item-deposits/:id/loan', kioskAuth, ctrl.kioskLoan);
kioskRouter.post('/kiosk/student-item-deposits/:id/return-daily', kioskAuth, ctrl.kioskReturnDaily);
kioskRouter.get('/kiosk/student-item-deposits/today-history', kioskAuth, ctrl.kioskTodayHistory);

module.exports = { router, kioskRouter };
