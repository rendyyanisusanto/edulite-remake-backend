'use strict';
const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('./cbt_upload.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

// Use memory storage for direct MinIO upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(authMiddleware);

// Upload endpoint
// Any user who can create a question bank OR view a question can upload (mainly teacher / admin)
router.post('/', permissionMiddleware('cbt.question.create'), upload.single('media'), controller.uploadImage);

module.exports = router;
