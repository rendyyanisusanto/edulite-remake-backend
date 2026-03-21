const express = require('express');
const router = express.Router();
const classHistoryController = require('./student_class_history.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

router.get('/', permissionMiddleware('class_history.view'), classHistoryController.getAllClassHistories);
router.get('/student/:student_id', permissionMiddleware('class_history.view'), classHistoryController.getStudentHistory);
router.get('/:id', permissionMiddleware('class_history.view'), classHistoryController.getClassHistoryById);

router.post('/', permissionMiddleware('class_history.create'), classHistoryController.createClassHistory);
router.put('/:id', permissionMiddleware('class_history.update'), classHistoryController.updateClassHistory);
router.delete('/:id', permissionMiddleware('class_history.delete'), classHistoryController.deleteClassHistory);

module.exports = router;
