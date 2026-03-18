'use strict';

const express = require('express');
const router = express.Router();
const guestbookController = require('./guestbook.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

// Export routes must be before /:id to avoid conflict
router.get('/export/excel', permissionMiddleware('guestbook.view'), guestbookController.exportExcel);
router.get('/export/pdf', permissionMiddleware('guestbook.view'), guestbookController.exportPdf);

// CRUD
router.get('/', permissionMiddleware('guestbook.view'), guestbookController.findAll);
router.get('/:id', permissionMiddleware('guestbook.view'), guestbookController.findById);
router.post('/', permissionMiddleware('guestbook.create'), guestbookController.create);
router.put('/:id', permissionMiddleware('guestbook.update'), guestbookController.update);

// Status actions
router.patch('/:id/checkout', permissionMiddleware('guestbook.update'), guestbookController.checkout);
router.patch('/:id/cancel', permissionMiddleware('guestbook.update'), guestbookController.cancel);

router.delete('/:id', permissionMiddleware('guestbook.delete'), guestbookController.delete);

module.exports = router;
