'use strict';
const express = require('express');
const router = express.Router();
const kioskRouter = express.Router();
const multer = require('multer');
const path = require('path');
const controller = require('./student_leave_request.controller');
const studentController = require('../students/student.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

const fs = require('fs');

const uploadDir = path.join(__dirname, '../../../public/uploads/student_leaves');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Local upload config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'leave-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.pdf'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and PDF are allowed.'));
        }
    }
});

const kioskAuth = (req, res, next) => {
    const rawConfiguredToken = process.env.KIOSK_INTERNAL_TOKEN || process.env.VITE_KIOSK_INTERNAL_TOKEN || '';
    const configuredToken = String(rawConfiguredToken).trim();
    const tokenFromHeader = String(req.headers['x-kiosk-token'] || '').trim();
    const tokenFromBody = String((req.body && req.body.kiosk_token) || '').trim();
    const tokenFromQuery = String((req.query && req.query.kiosk_token) || '').trim();
    const token = tokenFromHeader || tokenFromBody || tokenFromQuery;

    if (configuredToken.length > 0 && token && token !== configuredToken) {
        return res.status(401).json({ success: false, message: 'Unauthorized kiosk token', error_code: 'UNAUTHORIZED' });
    }
    return next();
};

kioskRouter.post('/kiosk/student-leave-requests', kioskAuth, upload.single('attachment'), controller.create);
kioskRouter.get('/kiosk/students', kioskAuth, studentController.findAll);

router.use(authMiddleware);

router.get('/', permissionMiddleware('counseling.leave_requests.view'), controller.findAll);
router.get('/:id', permissionMiddleware('counseling.leave_requests.view'), controller.findById);
router.post('/', permissionMiddleware('counseling.leave_requests.create'), upload.single('attachment'), controller.create);
router.put('/:id', permissionMiddleware('counseling.leave_requests.update'), upload.single('attachment'), controller.update);
router.delete('/:id', permissionMiddleware('counseling.leave_requests.delete'), controller.delete);
router.put('/:id/approve', permissionMiddleware('counseling.leave_requests.approve'), controller.approve);
router.put('/:id/reject', permissionMiddleware('counseling.leave_requests.approve'), controller.reject);

module.exports = { router, kioskRouter };
