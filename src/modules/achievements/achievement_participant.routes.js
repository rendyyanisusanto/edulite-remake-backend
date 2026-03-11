const express = require('express');
const router = express.Router();
const participantController = require('./achievement_participant.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', participantController.findAll);
router.get('/:id', participantController.findById);
router.post('/', participantController.create);
router.put('/:id', participantController.update);
router.delete('/:id', participantController.delete);

module.exports = router;
