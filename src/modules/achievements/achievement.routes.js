const express = require('express');
const router = express.Router();
const achievementController = require('./achievement.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', achievementController.findAll);
router.get('/:id', achievementController.findById);
router.post('/', achievementController.create);
router.put('/:id', achievementController.update);
router.delete('/:id', achievementController.delete);

module.exports = router;
