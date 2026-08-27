const express = require('express');
const router = express.Router();
const tahfidzKioskController = require('./tahfidz_kiosk.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

router.get('/', permissionMiddleware('tahfidz_attendance.report'), tahfidzKioskController.getAll);
router.post('/generate', permissionMiddleware('tahfidz_attendance.report'), tahfidzKioskController.generateToken);
router.patch('/:id/toggle-active', permissionMiddleware('tahfidz_attendance.report'), tahfidzKioskController.toggleActive);

module.exports = router;
