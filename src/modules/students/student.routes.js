const express = require('express');
const router = express.Router();
const multer = require('multer');
const studentController = require('./student.controller');
const studentCharacterController = require('./student_character.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

// Use multer with memory storage so we can read the buffer directly for Excel parsing
const upload = multer({ storage: multer.memoryStorage() });

router.get('/template', authMiddleware, permissionMiddleware('student.view'), studentController.downloadTemplate);
router.get('/export/excel', authMiddleware, permissionMiddleware('student.export'), studentController.exportExcel);
router.post('/import', authMiddleware, permissionMiddleware('student.import'), upload.single('file'), studentController.importExcel);

router.get('/:id/character-report', authMiddleware, permissionMiddleware('character_report.view'), studentCharacterController.getCharacterReport);
router.get('/:id/character-report/pdf', authMiddleware, permissionMiddleware('character_report.view'), studentCharacterController.exportCharacterReportPdf);

router.get('/', authMiddleware, permissionMiddleware('student.view'), studentController.findAll);
router.get('/:id', authMiddleware, permissionMiddleware('student.view'), studentController.findById);
router.post('/', authMiddleware, permissionMiddleware('student.create'), studentController.create);
router.put('/:id', authMiddleware, permissionMiddleware('student.update'), studentController.update);
router.delete('/:id', authMiddleware, permissionMiddleware('student.delete'), studentController.delete);

module.exports = router;
