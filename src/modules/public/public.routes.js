const express = require('express');
const router = express.Router();
const publicController = require('./public.controller');

router.get('/student-dashboard/:id', publicController.getStudentDashboard);

// Manual Kiosk endpoints
router.get('/kiosk/manual/students/search', publicController.kioskManualSearchStudents);
router.post('/kiosk/manual/student-attendances/scan', publicController.kioskManualAttendanceScan);
router.post('/kiosk/manual/student-toilet-permissions/scan', publicController.kioskManualToiletScan);
router.get('/kiosk/manual/toilet/currently-out', publicController.kioskManualToiletCurrentlyOut);

module.exports = router;
