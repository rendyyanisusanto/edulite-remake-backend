'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctrl = require('./document_setting.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

// Use memoryStorage so buffer is available for MinIO upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

router.use(authMiddleware);

// List all document settings (with optional filters: document_type, school_profile_id, is_active)
router.get('/', permissionMiddleware('setting.document_setting.view'), ctrl.list);

// Get single document setting by id
router.get('/:id', permissionMiddleware('setting.document_setting.view'), ctrl.detail);

// Create new document setting
router.post('/', permissionMiddleware('setting.document_setting.create'), ctrl.create);

// Update document setting (non-image fields)
router.put('/:id', permissionMiddleware('setting.document_setting.update'), ctrl.update);

// Toggle active status
router.patch('/:id/status', permissionMiddleware('setting.document_setting.update'), ctrl.updateStatus);

// Upload an image asset for a document setting
// field = header_image | footer_image | signature_image | stamp_image | watermark_image
router.post('/:id/upload/:field', permissionMiddleware('setting.document_setting.update'), upload.single('file'), ctrl.uploadAsset);

module.exports = router;
