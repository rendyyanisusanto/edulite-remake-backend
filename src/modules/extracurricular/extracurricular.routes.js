'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');

const ctrl = require('./extracurricular.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');
const { permissionMiddleware } = require('../../core/middleware/permission.middleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }
});

router.use(authMiddleware);

router.get('/categories', permissionMiddleware('extracurricular.view'), ctrl.getCategories);
router.post('/categories', permissionMiddleware('extracurricular.create'), ctrl.createCategory);
router.put('/categories/:id', permissionMiddleware('extracurricular.update'), ctrl.updateCategory);

router.get('/', permissionMiddleware('extracurricular.view'), ctrl.getExtracurriculars);
router.post('/', permissionMiddleware('extracurricular.create'), ctrl.createExtracurricular);
router.put('/:id', permissionMiddleware('extracurricular.update'), ctrl.updateExtracurricular);
router.patch('/:id/toggle-active', permissionMiddleware('extracurricular.update'), ctrl.toggleExtracurricular);

router.get('/coaches', permissionMiddleware('extracurricular.manage_trainer'), ctrl.getCoaches);
router.get('/coaches/:id', permissionMiddleware('extracurricular.manage_trainer'), ctrl.getCoachById);
router.post('/coaches', permissionMiddleware('extracurricular.manage_trainer'), ctrl.createCoach);
router.put('/coaches/:id', permissionMiddleware('extracurricular.manage_trainer'), ctrl.updateCoach);
router.delete('/coaches/:id', permissionMiddleware('extracurricular.manage_trainer'), ctrl.deleteCoach);
router.post('/coaches/:id/photo', permissionMiddleware('extracurricular.manage_trainer'), upload.single('photo'), ctrl.uploadCoachPhoto);
router.patch('/coaches/:id/toggle-active', permissionMiddleware('extracurricular.manage_trainer'), ctrl.toggleCoach);

router.get('/assignments', permissionMiddleware('extracurricular.manage_trainer'), ctrl.getAssignments);
router.post('/assignments', permissionMiddleware('extracurricular.manage_trainer'), ctrl.createAssignment);
router.put('/assignments/:id', permissionMiddleware('extracurricular.manage_trainer'), ctrl.updateAssignment);
router.delete('/assignments/:id', permissionMiddleware('extracurricular.manage_trainer'), ctrl.deleteAssignment);
router.patch('/assignments/:id/toggle-active', permissionMiddleware('extracurricular.manage_trainer'), ctrl.toggleAssignment);

router.get('/schedules', permissionMiddleware('extracurricular.manage_schedule'), ctrl.getSchedules);
router.post('/schedules', permissionMiddleware('extracurricular.manage_schedule'), ctrl.createSchedule);
router.put('/schedules/:id', permissionMiddleware('extracurricular.manage_schedule'), ctrl.updateSchedule);

router.get('/members', permissionMiddleware('extracurricular.member.view'), ctrl.getMembers);
router.post('/members', permissionMiddleware('extracurricular.member.manage'), ctrl.createMember);
router.post('/members/bulk', permissionMiddleware('extracurricular.member.manage'), ctrl.createMembersBulk);
router.put('/members/:id', permissionMiddleware('extracurricular.member.manage'), ctrl.updateMember);
router.patch('/members/:id/status', permissionMiddleware('extracurricular.member.manage'), ctrl.updateMemberStatus);
router.delete('/members/:id', permissionMiddleware('extracurricular.member.manage'), ctrl.deleteMember);

router.get('/sessions', permissionMiddleware('extracurricular.session.view'), ctrl.getSessions);
router.get('/sessions/:id', permissionMiddleware('extracurricular.session.view'), ctrl.getSessionById);
router.post('/sessions', permissionMiddleware('extracurricular.session.create'), ctrl.createSession);
router.put('/sessions/:id', permissionMiddleware('extracurricular.session.update'), ctrl.updateSession);
router.post('/sessions/:id/open', permissionMiddleware('extracurricular.session.update'), ctrl.openSession);
router.post('/sessions/:id/close', permissionMiddleware('extracurricular.session.close'), ctrl.closeSession);
router.post('/sessions/:id/cancel', permissionMiddleware('extracurricular.session.update'), ctrl.cancelSession);

router.post('/sessions/:id/coach-checkin', permissionMiddleware('extracurricular.coach_attendance.mark'), ctrl.coachCheckIn);
router.post('/sessions/:id/coach-checkout', permissionMiddleware('extracurricular.coach_attendance.mark'), ctrl.coachCheckOut);

router.get('/sessions/:id/student-attendances', permissionMiddleware('extracurricular.student_attendance.view'), ctrl.getStudentAttendances);
router.post('/sessions/:id/student-attendances/bulk', permissionMiddleware('extracurricular.student_attendance.mark'), ctrl.bulkStudentAttendances);

router.get('/progress-aspects', permissionMiddleware('extracurricular.progress.view'), ctrl.getProgressAspects);
router.post('/progress-aspects', permissionMiddleware('extracurricular.progress.create'), ctrl.createProgressAspect);
router.put('/progress-aspects/:id', permissionMiddleware('extracurricular.progress.update'), ctrl.updateProgressAspect);
router.delete('/progress-aspects/:id', permissionMiddleware('extracurricular.progress.update'), ctrl.deleteProgressAspect);
router.patch('/progress-aspects/:id/toggle-active', permissionMiddleware('extracurricular.progress.update'), ctrl.toggleProgressAspect);

router.get('/student-progress', permissionMiddleware('extracurricular.progress.view'), ctrl.getStudentProgress);
router.post('/student-progress', permissionMiddleware('extracurricular.progress.create'), ctrl.createStudentProgress);
router.put('/student-progress/:id', permissionMiddleware('extracurricular.progress.update'), ctrl.updateStudentProgress);
router.delete('/student-progress/:id', permissionMiddleware('extracurricular.progress.update'), ctrl.deleteStudentProgress);

router.get('/:id/schedules', permissionMiddleware('extracurricular.manage_schedule'), ctrl.getSchedulesByExtracurricular);
router.get('/:id/members', permissionMiddleware('extracurricular.member.view'), ctrl.getMembersByExtracurricular);
router.get('/:id/available-students', permissionMiddleware('extracurricular.member.view'), ctrl.getAvailableStudents);
router.get('/:id/assigned-students', permissionMiddleware('extracurricular.member.view'), ctrl.getAssignedStudents);
router.get('/:id', permissionMiddleware('extracurricular.view'), ctrl.getExtracurricularById);

module.exports = router;
