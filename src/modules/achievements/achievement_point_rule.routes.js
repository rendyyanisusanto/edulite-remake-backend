const express = require('express');
const router = express.Router();
const pointRuleController = require('./achievement_point_rule.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', pointRuleController.findAll);
router.get('/:id', pointRuleController.findById);
router.post('/', pointRuleController.create);
router.put('/:id', pointRuleController.update);
router.delete('/:id', pointRuleController.delete);

module.exports = router;
