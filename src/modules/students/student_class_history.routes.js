const express = require('express');
const router = express.Router();
const classHistoryController = require('./student_class_history.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', classHistoryController.getAllClassHistories);
router.get('/:id', classHistoryController.getClassHistoryById);

router.post('/', classHistoryController.createClassHistory);
router.put('/:id', classHistoryController.updateClassHistory);
router.delete('/:id', classHistoryController.deleteClassHistory);

module.exports = router;
