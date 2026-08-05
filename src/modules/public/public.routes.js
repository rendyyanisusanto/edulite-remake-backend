const express = require('express');
const router = express.Router();
const publicController = require('./public.controller');

router.get('/student-dashboard/:id', publicController.getStudentDashboard);

module.exports = router;
