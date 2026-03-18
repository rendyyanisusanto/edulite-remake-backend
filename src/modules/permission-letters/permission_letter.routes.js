'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('./permission_letter.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

// Generate code (must be before /:id)
router.get('/generate-code', permissionMiddleware('permission_letter.create'), ctrl.generateCode);

// List & Create
router.get('/', permissionMiddleware('permission_letter.view'), ctrl.findAll);
router.post('/', permissionMiddleware('permission_letter.create'), ctrl.create);

// Print PDF (must be before /:id to avoid conflict)
router.get('/:id/print', permissionMiddleware('permission_letter.view'), ctrl.printPdf);

// Status transitions (must be before /:id to avoid conflict)
router.patch('/:id/submit', permissionMiddleware('permission_letter.update'), ctrl.submit);
router.patch('/:id/approve', permissionMiddleware('permission_letter.approve'), ctrl.approve);
router.patch('/:id/reject', permissionMiddleware('permission_letter.approve'), ctrl.reject);
router.patch('/:id/cancel', permissionMiddleware('permission_letter.update'), ctrl.cancel);

// Detail, Update, Delete
router.get('/:id', permissionMiddleware('permission_letter.view'), ctrl.findById);
router.put('/:id', permissionMiddleware('permission_letter.update'), ctrl.update);
router.delete('/:id', permissionMiddleware('permission_letter.delete'), ctrl.delete);

module.exports = router;
