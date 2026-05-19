'use strict';

const svc = require('./extracurricular.service');

const ok = (res, data, message) => res.json({ success: true, ...(message ? { message } : {}), data });

exports.getCategories = async (req, res, next) => {
    try { ok(res, await svc.getCategories(req.query)); } catch (e) { next(e); }
};
exports.createCategory = async (req, res, next) => {
    try { ok(res.status(201), await svc.createCategory(req.body), 'Kategori ekskul berhasil dibuat'); } catch (e) { next(e); }
};
exports.updateCategory = async (req, res, next) => {
    try { ok(res, await svc.updateCategory(req.params.id, req.body), 'Kategori ekskul berhasil diubah'); } catch (e) { next(e); }
};

exports.getExtracurriculars = async (req, res, next) => {
    try { ok(res, await svc.getExtracurriculars(req.query, req.user)); } catch (e) { next(e); }
};
exports.getExtracurricularById = async (req, res, next) => {
    try { ok(res, await svc.getExtracurricularById(req.params.id, req.user)); } catch (e) { next(e); }
};
exports.createExtracurricular = async (req, res, next) => {
    try { ok(res.status(201), await svc.createExtracurricular(req.body, req.user.id), 'Ekskul berhasil dibuat'); } catch (e) { next(e); }
};
exports.updateExtracurricular = async (req, res, next) => {
    try { ok(res, await svc.updateExtracurricular(req.params.id, req.body, req.user.id), 'Ekskul berhasil diubah'); } catch (e) { next(e); }
};
exports.toggleExtracurricular = async (req, res, next) => {
    try { ok(res, await svc.toggleExtracurricularActive(req.params.id, req.user.id), 'Status ekskul berhasil diubah'); } catch (e) { next(e); }
};

exports.getCoaches = async (req, res, next) => {
    try { ok(res, await svc.getCoaches(req.query)); } catch (e) { next(e); }
};
exports.getCoachById = async (req, res, next) => {
    try { ok(res, await svc.getCoachById(req.params.id)); } catch (e) { next(e); }
};
exports.createCoach = async (req, res, next) => {
    try { ok(res.status(201), await svc.createCoach(req.body, req.user), 'Pelatih ekskul berhasil dibuat'); } catch (e) { next(e); }
};
exports.updateCoach = async (req, res, next) => {
    try { ok(res, await svc.updateCoach(req.params.id, req.body, req.user), 'Pelatih ekskul berhasil diubah'); } catch (e) { next(e); }
};
exports.toggleCoach = async (req, res, next) => {
    try { ok(res, await svc.toggleCoachActive(req.params.id, req.user.id), 'Status pelatih berhasil diubah'); } catch (e) { next(e); }
};
exports.deleteCoach = async (req, res, next) => {
    try {
        await svc.deleteCoach(req.params.id);
        res.json({ success: true, message: 'Pelatih ekskul berhasil dihapus' });
    } catch (e) { next(e); }
};
exports.uploadCoachPhoto = async (req, res, next) => {
    try {
        ok(res, await svc.uploadCoachPhoto(req.params.id, req.file, req.user.id), 'Foto pelatih berhasil diupload');
    } catch (e) { next(e); }
};

exports.getAssignments = async (req, res, next) => {
    try { ok(res, await svc.getAssignments(req.query, req.user)); } catch (e) { next(e); }
};
exports.createAssignment = async (req, res, next) => {
    try { ok(res.status(201), await svc.createAssignment(req.body, req.user.id), 'Assignment pelatih berhasil dibuat'); } catch (e) { next(e); }
};
exports.updateAssignment = async (req, res, next) => {
    try { ok(res, await svc.updateAssignment(req.params.id, req.body, req.user.id), 'Assignment pelatih berhasil diubah'); } catch (e) { next(e); }
};
exports.toggleAssignment = async (req, res, next) => {
    try { ok(res, await svc.toggleAssignmentActive(req.params.id, req.user.id), 'Status assignment berhasil diubah'); } catch (e) { next(e); }
};
exports.deleteAssignment = async (req, res, next) => {
    try {
        await svc.deleteAssignment(req.params.id);
        res.json({ success: true, message: 'Assignment pelatih berhasil dihapus' });
    } catch (e) { next(e); }
};

exports.getSchedules = async (req, res, next) => {
    try { ok(res, await svc.getSchedules(req.query, req.user)); } catch (e) { next(e); }
};
exports.getSchedulesByExtracurricular = async (req, res, next) => {
    try { ok(res, await svc.getSchedulesByExtracurricular(req.params.id, req.user)); } catch (e) { next(e); }
};
exports.createSchedule = async (req, res, next) => {
    try { ok(res.status(201), await svc.createSchedule(req.body, req.user), 'Jadwal ekskul berhasil dibuat'); } catch (e) { next(e); }
};
exports.updateSchedule = async (req, res, next) => {
    try { ok(res, await svc.updateSchedule(req.params.id, req.body, req.user), 'Jadwal ekskul berhasil diubah'); } catch (e) { next(e); }
};

exports.getRegistrations = async (req, res, next) => {
    try { ok(res, await svc.getRegistrations(req.query, req.user)); } catch (e) { next(e); }
};
exports.createRegistration = async (req, res, next) => {
    try { ok(res.status(201), await svc.createRegistration(req.body, req.user), 'Pendaftaran ekskul berhasil dibuat'); } catch (e) { next(e); }
};
exports.approveRegistration = async (req, res, next) => {
    try { ok(res, await svc.approveRegistration(req.params.id, req.user, req.body), 'Pendaftaran ekskul berhasil disetujui'); } catch (e) { next(e); }
};
exports.rejectRegistration = async (req, res, next) => {
    try { ok(res, await svc.rejectRegistration(req.params.id, req.user, req.body), 'Pendaftaran ekskul berhasil ditolak'); } catch (e) { next(e); }
};
exports.cancelRegistration = async (req, res, next) => {
    try { ok(res, await svc.cancelRegistration(req.params.id, req.user, req.body), 'Pendaftaran ekskul berhasil dibatalkan'); } catch (e) { next(e); }
};

exports.getMembers = async (req, res, next) => {
    try { ok(res, await svc.getMembers(req.query, req.user)); } catch (e) { next(e); }
};
exports.getMembersByExtracurricular = async (req, res, next) => {
    try { ok(res, await svc.getMembersByExtracurricular(req.params.id, req.query, req.user)); } catch (e) { next(e); }
};
exports.createMember = async (req, res, next) => {
    try { ok(res.status(201), await svc.createMember(req.body, req.user), 'Anggota ekskul berhasil ditambahkan'); } catch (e) { next(e); }
};
exports.createMembersBulk = async (req, res, next) => {
    try { ok(res.status(201), await svc.createMembersBulk(req.body, req.user), 'Bulk anggota ekskul berhasil diproses'); } catch (e) { next(e); }
};
exports.updateMember = async (req, res, next) => {
    try { ok(res, await svc.updateMember(req.params.id, req.body, req.user), 'Data anggota ekskul berhasil diubah'); } catch (e) { next(e); }
};
exports.updateMemberStatus = async (req, res, next) => {
    try { ok(res, await svc.updateMemberStatus(req.params.id, req.body, req.user), 'Status anggota ekskul berhasil diubah'); } catch (e) { next(e); }
};
exports.deleteMember = async (req, res, next) => {
    try {
        await svc.deleteMember(req.params.id, req.user);
        res.json({ success: true, message: 'Anggota ekskul berhasil dihapus' });
    } catch (e) { next(e); }
};
exports.getAvailableStudents = async (req, res, next) => {
    try { ok(res, await svc.getAvailableStudents(req.params.id, req.query, req.user)); } catch (e) { next(e); }
};
exports.getAssignedStudents = async (req, res, next) => {
    try { ok(res, await svc.getAssignedStudents(req.params.id, req.query, req.user)); } catch (e) { next(e); }
};

exports.getSessions = async (req, res, next) => {
    try { ok(res, await svc.getSessions(req.query, req.user)); } catch (e) { next(e); }
};
exports.getSessionById = async (req, res, next) => {
    try { ok(res, await svc.getSessionById(req.params.id, req.user)); } catch (e) { next(e); }
};
exports.createSession = async (req, res, next) => {
    try { ok(res.status(201), await svc.createSession(req.body, req.user), 'Sesi ekskul berhasil dibuat'); } catch (e) { next(e); }
};
exports.updateSession = async (req, res, next) => {
    try { ok(res, await svc.updateSession(req.params.id, req.body, req.user), 'Sesi ekskul berhasil diubah'); } catch (e) { next(e); }
};
exports.openSession = async (req, res, next) => {
    try { ok(res, await svc.openSession(req.params.id, req.user), 'Sesi ekskul berhasil dibuka'); } catch (e) { next(e); }
};
exports.closeSession = async (req, res, next) => {
    try { ok(res, await svc.closeSession(req.params.id, req.user), 'Sesi ekskul berhasil ditutup'); } catch (e) { next(e); }
};
exports.cancelSession = async (req, res, next) => {
    try { ok(res, await svc.cancelSession(req.params.id, req.user, req.body), 'Sesi ekskul berhasil dibatalkan'); } catch (e) { next(e); }
};

exports.coachCheckIn = async (req, res, next) => {
    try { ok(res, await svc.coachCheckIn(req.params.id, req.user, req.body), 'Check-in pelatih berhasil'); } catch (e) { next(e); }
};
exports.coachCheckOut = async (req, res, next) => {
    try { ok(res, await svc.coachCheckOut(req.params.id, req.user, req.body), 'Check-out pelatih berhasil'); } catch (e) { next(e); }
};

exports.getStudentAttendances = async (req, res, next) => {
    try { ok(res, await svc.getSessionStudentAttendances(req.params.id, req.user)); } catch (e) { next(e); }
};
exports.bulkStudentAttendances = async (req, res, next) => {
    try { ok(res, await svc.bulkMarkStudentAttendances(req.params.id, req.body, req.user), 'Presensi siswa berhasil disimpan'); } catch (e) { next(e); }
};

exports.getProgressAspects = async (req, res, next) => {
    try { ok(res, await svc.getProgressAspects(req.query, req.user)); } catch (e) { next(e); }
};
exports.createProgressAspect = async (req, res, next) => {
    try { ok(res.status(201), await svc.createProgressAspect(req.body, req.user), 'Aspek perkembangan berhasil dibuat'); } catch (e) { next(e); }
};
exports.updateProgressAspect = async (req, res, next) => {
    try { ok(res, await svc.updateProgressAspect(req.params.id, req.body, req.user), 'Aspek perkembangan berhasil diubah'); } catch (e) { next(e); }
};
exports.deleteProgressAspect = async (req, res, next) => {
    try {
        await svc.deleteProgressAspect(req.params.id, req.user);
        res.json({ success: true, message: 'Aspek perkembangan berhasil dihapus' });
    } catch (e) { next(e); }
};
exports.toggleProgressAspect = async (req, res, next) => {
    try { ok(res, await svc.toggleProgressAspect(req.params.id, req.user), 'Status aspek perkembangan berhasil diubah'); } catch (e) { next(e); }
};

exports.getStudentProgress = async (req, res, next) => {
    try { ok(res, await svc.getStudentProgresses(req.query, req.user)); } catch (e) { next(e); }
};
exports.createStudentProgress = async (req, res, next) => {
    try { ok(res.status(201), await svc.createStudentProgress(req.body, req.user), 'Perkembangan siswa berhasil disimpan'); } catch (e) { next(e); }
};
exports.updateStudentProgress = async (req, res, next) => {
    try { ok(res, await svc.updateStudentProgress(req.params.id, req.body, req.user), 'Perkembangan siswa berhasil diubah'); } catch (e) { next(e); }
};
exports.deleteStudentProgress = async (req, res, next) => {
    try {
        await svc.deleteStudentProgress(req.params.id, req.user);
        res.json({ success: true, message: 'Perkembangan siswa berhasil dihapus' });
    } catch (e) { next(e); }
};

exports.getMyExtracurricular = async (req, res, next) => {
    try { ok(res, await svc.getMyExtracurricular(req.user)); } catch (e) { next(e); }
};
exports.getMyExtracurricularDetail = async (req, res, next) => {
    try { ok(res, await svc.getMyExtracurricularDetail(req.user, req.params.id)); } catch (e) { next(e); }
};
exports.getMySchedules = async (req, res, next) => {
    try { ok(res, await svc.getSchedulesByExtracurricular(req.params.id, req.user)); } catch (e) { next(e); }
};
exports.getMyMembers = async (req, res, next) => {
    try { ok(res, await svc.getMembersByExtracurricular(req.params.id, req.query, req.user)); } catch (e) { next(e); }
};
exports.getMyTodaySessions = async (req, res, next) => {
    try { ok(res, await svc.getMyTodaySessions(req.user)); } catch (e) { next(e); }
};
exports.getMyAttendances = async (req, res, next) => {
    try { ok(res, await svc.getMyAttendances(req.user, req.query)); } catch (e) { next(e); }
};
exports.getMyProgress = async (req, res, next) => {
    try { ok(res, await svc.getMyProgress(req.user, req.query)); } catch (e) { next(e); }
};
exports.getMyProgressAspects = async (req, res, next) => {
    try { ok(res, await svc.getMyProgressAspects(req.user, req.params.id, req.query)); } catch (e) { next(e); }
};
exports.getMyStudentProgress = async (req, res, next) => {
    try { ok(res, await svc.getMyStudentProgress(req.user, req.params.id, req.params.studentId, req.query)); } catch (e) { next(e); }
};
