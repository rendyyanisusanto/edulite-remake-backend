const express = require('express');
const router = express.Router();
const publicController = require('./public.controller');

const publicTahfidzController = require('./public_tahfidz.controller');

router.get('/student-dashboard/:id', publicController.getStudentDashboard);

// Manual Kiosk endpoints
router.get('/kiosk/manual/students/search', publicController.kioskManualSearchStudents);
router.post('/kiosk/manual/student-attendances/scan', publicController.kioskManualAttendanceScan);
router.post('/kiosk/manual/student-toilet-permissions/scan', publicController.kioskManualToiletScan);
router.get('/kiosk/manual/toilet/currently-out', publicController.kioskManualToiletCurrentlyOut);

// Tahfidz Kiosk endpoints
router.get('/kiosk/tahfidz/:token', publicTahfidzController.getKioskData);
router.post('/kiosk/tahfidz/:token/attendance', publicTahfidzController.saveAttendance);

module.exports = router;
