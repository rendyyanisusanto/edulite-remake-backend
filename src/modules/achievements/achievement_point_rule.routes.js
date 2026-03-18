const express = require('express');
const router = express.Router();
const pointRuleController = require('./achievement_point_rule.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

router.use(authMiddleware);

router.get('/', permissionMiddleware('achievement_point_rule.view'), pointRuleController.findAll);
router.get('/:id', permissionMiddleware('achievement_point_rule.view'), pointRuleController.findById);
router.post('/', permissionMiddleware('achievement_point_rule.create'), pointRuleController.create);
router.put('/:id', permissionMiddleware('achievement_point_rule.update'), pointRuleController.update);
router.delete('/:id', permissionMiddleware('achievement_point_rule.delete'), pointRuleController.delete);

module.exports = router;
