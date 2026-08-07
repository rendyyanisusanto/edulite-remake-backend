const express = require('express');
const router = express.Router();
const classReportController = require('./class_report.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

// All endpoints use class_assignment.view permission since this is a reporting feature
router.get('/:classId/data',
  permissionMiddleware('class_assignment.view'),
  classReportController.getClassReportData
);

router.get('/:classId/print',
  permissionMiddleware('class_assignment.view'),
  classReportController.printPreview
);

router.get('/:classId/pdf',
  permissionMiddleware('class_assignment.view'),
  classReportController.printPdf
);

module.exports = router;
