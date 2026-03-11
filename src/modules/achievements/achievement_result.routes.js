const express = require('express');
const router = express.Router();
const resultController = require('./achievement_result.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', resultController.findAll);
router.get('/:id', resultController.findById);
router.post('/', resultController.create);
router.put('/:id', resultController.update);
router.delete('/:id', resultController.delete);

module.exports = router;
