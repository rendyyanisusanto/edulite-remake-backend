const express = require('express');
const router = express.Router();
const parentController = require('./parent.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', parentController.findAll);
router.get('/:id', parentController.findById);
router.post('/', parentController.create);
router.put('/:id', parentController.update);
router.delete('/:id', parentController.delete);

module.exports = router;
