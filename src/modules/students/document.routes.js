const express = require('express');
const router = express.Router();
const documentController = require('./document.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', documentController.findAll);
router.get('/:id', documentController.findById);
router.post('/', documentController.create);
router.put('/:id', documentController.update);
router.delete('/:id', documentController.delete);

module.exports = router;
