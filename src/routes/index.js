const express = require('express');
const router = express.Router();
const { loggerMiddleware } = require('../core/middleware/logger.middleware');

router.use(loggerMiddleware);

const authRoutes = require('../modules/auth/auth.routes');
const studentRoutes = require('../modules/students/student.routes');
const parentRoutes = require('../modules/students/parent.routes');
const documentRoutes = require('../modules/students/document.routes');
const studentClassHistoryRoutes = require('../modules/students/student_class_history.routes');

const academicRoutes = require('../modules/academic/academic.routes');
const violationRoutes = require('../modules/violations/violation.routes');

const achievementMainRoutes = require('../modules/achievements/achievement.routes');
const achievementParticipantRoutes = require('../modules/achievements/achievement_participant.routes');
const achievementResultRoutes = require('../modules/achievements/achievement_result.routes');
const achievementPointRuleRoutes = require('../modules/achievements/achievement_point_rule.routes');

const positivePointRoutes = require('../modules/positive-points/positive-points.routes');

router.get('/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date() });
});

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/class-histories', studentClassHistoryRoutes);
router.use('/parents', parentRoutes);
router.use('/documents', documentRoutes);
router.use('/academic', academicRoutes);
router.use('/violations', violationRoutes);
router.use('/positive-points', positivePointRoutes);

router.use('/achievements/participants', achievementParticipantRoutes);
router.use('/achievements/results', achievementResultRoutes);
router.use('/achievements/point-rules', achievementPointRuleRoutes);
router.use('/achievements', achievementMainRoutes);

module.exports = router;
