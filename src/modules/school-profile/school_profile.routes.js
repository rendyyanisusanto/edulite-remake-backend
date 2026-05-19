'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctrl = require('./school_profile.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

// Use memoryStorage so buffer is available for MinIO upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// Get public branding (no auth needed)
router.get('/public', ctrl.getPublic);

router.use(authMiddleware);

// Get current school profile (singleton)
router.get('/', permissionMiddleware('setting.school_profile.view'), ctrl.get);

// Create / update school profile (upsert)
router.put('/', permissionMiddleware('setting.school_profile.update'), ctrl.upsert);

// Upload image asset: field = logo | logo_light | logo_dark | favicon | school_icon
router.post('/upload/:field', permissionMiddleware('setting.school_profile.update'), upload.single('file'), ctrl.uploadAsset);

module.exports = router;
