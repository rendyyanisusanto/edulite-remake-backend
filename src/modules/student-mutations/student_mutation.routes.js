'use strict';

const express = require('express');
const multer = require('multer');
const ctrl = require('./student_mutation.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(authMiddleware);

router.get('/', permissionMiddleware('student.mutation.view'), ctrl.findAll);
router.get('/report', permissionMiddleware('student.mutation.report'), ctrl.report);
router.get('/:id', permissionMiddleware('student.mutation.view'), ctrl.findById);
router.get('/:id/print', permissionMiddleware('student.mutation.print'), ctrl.print);

router.post('/', permissionMiddleware('student.mutation.create'), upload.single('document_file'), ctrl.create);
router.put('/:id', permissionMiddleware('student.mutation.update'), upload.single('document_file'), ctrl.update);
router.post('/:id/upload-document', permissionMiddleware('student.mutation.update'), upload.single('file'), ctrl.uploadDocument);

router.post('/:id/submit', permissionMiddleware('student.mutation.submit'), ctrl.submit);
router.post('/:id/approve', permissionMiddleware('student.mutation.approve'), ctrl.approve);
router.post('/:id/reject', permissionMiddleware('student.mutation.reject'), ctrl.reject);
router.post('/:id/complete', permissionMiddleware('student.mutation.complete'), ctrl.complete);
router.post('/:id/cancel', permissionMiddleware('student.mutation.cancel'), ctrl.cancel);

module.exports = router;
