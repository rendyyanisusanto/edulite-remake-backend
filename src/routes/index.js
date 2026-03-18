const express = require('express');
const router = express.Router();
const { loggerMiddleware } = require('../core/middleware/logger.middleware');

router.use(loggerMiddleware);

const authRoutes = require('../modules/auth/auth.routes');

// RBAC modules
const roleRoutes = require('../modules/roles/role.routes');
const permissionRoutes = require('../modules/permissions/permission.routes');
const userRoutes = require('../modules/users/user.routes');
const menuRoutes = require('../modules/menus/menu.routes');

// Student modules
const studentRoutes = require('../modules/students/student.routes');
const parentRoutes = require('../modules/students/parent.routes');
const documentRoutes = require('../modules/students/document.routes');
const studentClassHistoryRoutes = require('../modules/students/student_class_history.routes');

// Academic
const academicRoutes = require('../modules/academic/academic.routes');

// Violations & Counseling
const violationRoutes = require('../modules/violations/violation.routes');

// Achievements
const achievementMainRoutes = require('../modules/achievements/achievement.routes');
const achievementParticipantRoutes = require('../modules/achievements/achievement_participant.routes');
const achievementResultRoutes = require('../modules/achievements/achievement_result.routes');
const achievementPointRuleRoutes = require('../modules/achievements/achievement_point_rule.routes');

// Other modules
const positivePointRoutes = require('../modules/positive-points/positive-points.routes');
const permissionLetterRoutes = require('../modules/permission-letters/permission_letter.routes');
const guestbookRoutes = require('../modules/guestbook/guestbook.routes');

router.get('/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date() });
});

// Auth
router.use('/auth', authRoutes);

// RBAC
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/users', userRoutes);
router.use('/menus', menuRoutes);

// Students
router.use('/students', studentRoutes);
router.use('/class-histories', studentClassHistoryRoutes);
router.use('/parents', parentRoutes);
router.use('/documents', documentRoutes);

// Academic
router.use('/academic', academicRoutes);

// Violations
router.use('/violations', violationRoutes);

// Positive Points
router.use('/positive-points', positivePointRoutes);

// Administration
router.use('/permission-letters', permissionLetterRoutes);
router.use('/guestbooks', guestbookRoutes);

// Achievements
router.use('/achievements/participants', achievementParticipantRoutes);
router.use('/achievements/results', achievementResultRoutes);
router.use('/achievements/point-rules', achievementPointRuleRoutes);
router.use('/achievements', achievementMainRoutes);

module.exports = router;
