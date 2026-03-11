const express = require('express');
const router = express.Router();
const multer = require('multer');
const studentController = require('./student.controller');
const studentCharacterController = require('./student_character.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const permissionMiddleware = require('../../core/middleware/permission.middleware');

// Use multer with memory storage so we can read the buffer directly for Excel parsing
const upload = multer({ storage: multer.memoryStorage() });

router.get('/template', authMiddleware, studentController.downloadTemplate);
router.get('/export/excel', authMiddleware, studentController.exportExcel);
router.post('/import', authMiddleware, upload.single('file'), studentController.importExcel);

router.get('/:id/character-report', authMiddleware, studentCharacterController.getCharacterReport);
router.get('/:id/character-report/pdf', authMiddleware, studentCharacterController.exportCharacterReportPdf);

router.get('/', authMiddleware, studentController.findAll);
router.get('/:id', authMiddleware, studentController.findById);
router.post('/', authMiddleware, studentController.create);
router.put('/:id', authMiddleware, studentController.update);
router.delete('/:id', authMiddleware, studentController.delete);

module.exports = router;
