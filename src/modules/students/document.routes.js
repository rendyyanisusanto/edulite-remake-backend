const express = require('express');
const router = express.Router();
const documentController = require('./document.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

router.get('/', permissionMiddleware('student_document.view'), documentController.findAll);
router.get('/:id', permissionMiddleware('student_document.view'), documentController.findById);
router.post('/', permissionMiddleware('student_document.create'), documentController.create);
router.put('/:id', permissionMiddleware('student_document.update'), documentController.update);
router.delete('/:id', permissionMiddleware('student_document.delete'), documentController.delete);

module.exports = router;
