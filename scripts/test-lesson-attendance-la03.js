'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const assert = require('assert');
const db = require('../src/models');
const lessonAttendanceService = require('../src/modules/lesson-attendance/lesson-attendance.service');
const pinService = require('../src/modules/lesson-attendance/lesson-attendance-pin.service');
const qrService = require('../src/modules/lesson-attendance/lesson-attendance-qr.service');
const auditService = require('../src/modules/lesson-attendance/lesson-attendance-audit.service');
const { ERROR_CODES, AUDIT_ACTIONS } = require('../src/modules/lesson-attendance/lesson-attendance.constants');

const results = [];
function recordResult(name, status, detail = '') {
    results.push({ name, status, detail });
    const icon = status === 'PASS' ? 'PASS' : 'FAIL';
    console.log(`[${icon}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function run() {
    const created = {
        gradeId: null,
        classIds: [],
        userIds: [],
        teacherIds: [],
        studentIds: [],
        historyIds: [],
        subjectId: null,
        templateId: null,
        periodIds: [],
        sessionIds: [],
        logIds: []
    };

    try {
        await db.sequelize.authenticate();

        // Idempotent pre-cleanup of any leftover __LA03 test rows from aborted runs
        await db.sequelize.query("DELETE FROM lesson_attendance_logs WHERE teacher_id IN (SELECT id FROM teachers WHERE full_name LIKE '__LA03%') OR session_id IN (SELECT id FROM lesson_attendance_sessions WHERE class_id IN (SELECT id FROM classes WHERE name LIKE '__LA03%'))");
        await db.sequelize.query("DELETE FROM lesson_attendance_details WHERE student_id IN (SELECT id FROM students WHERE nis LIKE 'LA03_%')");
        await db.sequelize.query("DELETE FROM lesson_attendance_sessions WHERE class_id IN (SELECT id FROM classes WHERE name LIKE '__LA03%')");
        await db.sequelize.query("DELETE FROM student_class_history WHERE student_id IN (SELECT id FROM students WHERE nis LIKE 'LA03_%')");
        await db.sequelize.query("DELETE FROM students WHERE nis LIKE 'LA03_%'");
        await db.sequelize.query("DELETE FROM lesson_periods WHERE name LIKE '__LA03%'");
        await db.sequelize.query("DELETE FROM subjects WHERE code LIKE '__LA03%'");
        await db.sequelize.query("DELETE FROM classes WHERE name LIKE '__LA03%'");
        await db.sequelize.query("DELETE FROM teachers WHERE full_name LIKE '__LA03%'");
        await db.sequelize.query("DELETE FROM users WHERE username LIKE '__la03_%'");
        await db.sequelize.query("DELETE FROM grades WHERE name LIKE '__LA03%'");

        // Find existing active and inactive academic years
        const activeYear = await lessonAttendanceService.getActiveAcademicYear();
        assert(activeYear && activeYear.id, 'Active academic year must exist');
        recordResult('Active academic year resolution', 'PASS', `id=${activeYear.id} (${activeYear.name})`);

        const inactiveYear = await db.AcademicYear.findOne({
            where: { is_active: false },
            order: [['id', 'ASC']]
        });
        assert(inactiveYear, 'An inactive academic year must exist for history test');

        // Create temporary Grade & 3 Classes (Class A, Class B, Empty Class C)
        const grade = await db.Grade.create({ name: '__LA03_TEST_GRADE', level: 99 });
        created.gradeId = grade.id;

        const clsA = await db.Class.create({ name: '__LA03_TEST_CLASS_A', grade_id: grade.id, capacity: 40 });
        const clsB = await db.Class.create({ name: '__LA03_TEST_CLASS_B', grade_id: grade.id, capacity: 40 });
        const clsC = await db.Class.create({ name: '__LA03_TEST_CLASS_C_EMPTY', grade_id: grade.id, capacity: 40 });
        created.classIds.push(clsA.id, clsB.id, clsC.id);

        // Create Users & Teachers: T1 with leading-zero PIN '042819', T2 without PIN
        const u1 = await db.User.create({ name: '__LA03 Teacher 1', username: '__la03_t1', email: '__la03_t1@test.local', password_hash: 'x', is_active: true });
        const u2 = await db.User.create({ name: '__LA03 Teacher 2', username: '__la03_t2', email: '__la03_t2@test.local', password_hash: 'x', is_active: true });
        created.userIds.push(u1.id, u2.id);

        const t1 = await db.Teacher.create({ user_id: u1.id, full_name: '__LA03_TEST_TEACHER_PIN', nip: '999000111' });
        const t2 = await db.Teacher.create({ user_id: u2.id, full_name: '__LA03_TEST_TEACHER_NOPIN', nip: '999000222' });
        created.teacherIds.push(t1.id, t2.id);

        await pinService.setManualPin(t1.id, '042819', null, '127.0.0.1');

        // Generate QR for Class A
        const qrRes = await qrService.generateClassQr(clsA.id, null, '127.0.0.1');
        const qrTokenA = qrRes.qr_url.split('/').pop();

        // Create Test Students covering all Section 46 scenarios:
        // S1: ACTIVE in Class A (active year)
        // S2: ACTIVE in Class A with rfid_is_active = false
        // S3: ACTIVE moved Class A -> Class B in active year (must appear ONLY in Class B)
        // S4: ACTIVE with multiple histories in Class A (must appear ONCE)
        // S5: ACTIVE with two histories having same created_at (Class B old id, Class A newer id -> tie breaker id DESC -> Class A)
        // S6: ACTIVE with history ONLY in inactiveYear -> must NOT appear
        // S7: INACTIVE in Class A -> must NOT appear
        // S8: GRADUATED in Class A -> must NOT appear
        // S9: TRANSFERRED (mutasi keluar) in Class A -> must NOT appear
        // S10: ACTIVE with NO class history -> must NOT appear
        const s1 = await db.Student.create({ nis: 'LA03_001', full_name: '__LA03 Siswa Alpha', student_status: 'ACTIVE', rfid_is_active: true });
        const s2 = await db.Student.create({ nis: 'LA03_002', full_name: '__LA03 Siswa Beta NoRfid', student_status: 'ACTIVE', rfid_is_active: false });
        const s3 = await db.Student.create({ nis: 'LA03_003', full_name: '__LA03 Siswa Pindah', student_status: 'ACTIVE', rfid_is_active: true });
        const s4 = await db.Student.create({ nis: 'LA03_004', full_name: '__LA03 Siswa MultiHist', student_status: 'ACTIVE', rfid_is_active: true });
        const s5 = await db.Student.create({ nis: 'LA03_005', full_name: '__LA03 Siswa TieBreak', student_status: 'ACTIVE', rfid_is_active: true });
        const s6 = await db.Student.create({ nis: 'LA03_006', full_name: '__LA03 Siswa OldYear', student_status: 'ACTIVE', rfid_is_active: true });
        const s7 = await db.Student.create({ nis: 'LA03_007', full_name: '__LA03 Siswa NonAktif', student_status: 'INACTIVE', rfid_is_active: true });
        const s8 = await db.Student.create({ nis: 'LA03_008', full_name: '__LA03 Siswa Lulus', student_status: 'GRADUATED', rfid_is_active: true });
        const s9 = await db.Student.create({ nis: 'LA03_009', full_name: '__LA03 Siswa Mutasi', student_status: 'TRANSFERRED', rfid_is_active: true });
        const s10 = await db.Student.create({ nis: 'LA03_010', full_name: '__LA03 Siswa Unassigned', student_status: 'ACTIVE', rfid_is_active: true });
        created.studentIds.push(s1.id, s2.id, s3.id, s4.id, s5.id, s6.id, s7.id, s8.id, s9.id, s10.id);

        const tOld = new Date('2026-08-01T08:00:00Z');
        const tNew = new Date('2026-09-01T08:00:00Z');
        const tSame = new Date('2026-10-01T08:00:00Z');

        const histPayloads = [
            { student_id: s1.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'MANUAL', created_at: tOld },
            { student_id: s2.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'MANUAL', created_at: tOld },
            // s3 moved A -> B
            { student_id: s3.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'MANUAL', created_at: tOld },
            { student_id: s3.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsB.id, assignment_type: 'MANUAL', created_at: tNew },
            // s4 multiple in A
            { student_id: s4.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'MANUAL', created_at: tOld },
            { student_id: s4.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'MANUAL', created_at: tNew },
            // s5 tie breaker same created_at: first B (lower id), then A (higher id)
            { student_id: s5.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsB.id, assignment_type: 'MANUAL', created_at: tSame },
            { student_id: s5.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'MANUAL', created_at: tSame },
            // s6 only inactive year
            { student_id: s6.id, academic_year_id: inactiveYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'MANUAL', created_at: tOld },
            // s7, s8, s9 non-ACTIVE
            { student_id: s7.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'MANUAL', created_at: tOld },
            { student_id: s8.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'MANUAL', created_at: tOld },
            { student_id: s9.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'MANUAL', created_at: tOld }
        ];

        for (const h of histPayloads) {
            const rec = await db.StudentClassHistory.create(h);
            created.historyIds.push(rec.id);
        }

        // TEST 1: Active Class Roster Resolution
        const rosterA = await lessonAttendanceService.getActiveClassRoster({
            classId: clsA.id,
            academicYearId: activeYear.id
        });
        const rosterAIds = rosterA.students.map((s) => s.student_id);
        assert.deepStrictEqual(
            new Set(rosterAIds),
            new Set([s1.id, s2.id, s4.id, s5.id]),
            `Expected Class A to have s1,s2,s4,s5, got ${rosterAIds}`
        );
        assert.strictEqual(rosterA.total_students, 4, 'No duplicate students allowed in Class A');
        // Ensure no private fields
        const sampleStudent = rosterA.students[0];
        assert.deepStrictEqual(Object.keys(sampleStudent).sort(), ['full_name', 'nis', 'student_id']);
        recordResult('Roster Class A (ACTIVE, no-RFID, multi-hist, tie-break, excludes moved/old-year/non-active)', 'PASS');

        const rosterB = await lessonAttendanceService.getActiveClassRoster({
            classId: clsB.id,
            academicYearId: activeYear.id
        });
        assert.deepStrictEqual(rosterB.students.map((s) => s.student_id), [s3.id], 'Moved student s3 must appear ONLY in Class B');
        recordResult('Roster Class B (transferred student appears only in latest class)', 'PASS');

        const rosterC = await lessonAttendanceService.getActiveClassRoster({
            classId: clsC.id,
            academicYearId: activeYear.id
        });
        assert.strictEqual(rosterC.total_students, 0);
        assert.deepStrictEqual(rosterC.students, []);
        recordResult('Roster Class C (empty class returns 0 students)', 'PASS');

        // TEST 2: Public QR & PIN Verification
        const resolved = await lessonAttendanceService.resolvePublicQr(qrTokenA);
        assert.strictEqual(resolved.valid, true);
        assert.strictEqual(resolved.students, undefined, 'Must NOT expose students before PIN verification');
        recordResult('Public QR resolve (valid, no student leak)', 'PASS');

        // Wrong PIN rejected
        let wrongPinFailed = false;
        try {
            await lessonAttendanceService.verifyTeacherPinByQr(qrTokenA, t1.id, '999999', '127.0.0.2');
        } catch (err) {
            wrongPinFailed = err.errorCode === ERROR_CODES.INVALID_ATTENDANCE_CREDENTIALS;
        }
        assert.strictEqual(wrongPinFailed, true, 'Wrong PIN must be rejected');

        // Teacher without PIN rejected
        let noPinFailed = false;
        try {
            await lessonAttendanceService.verifyTeacherPinByQr(qrTokenA, t2.id, '042819', '127.0.0.3');
        } catch (err) {
            noPinFailed = err.errorCode === ERROR_CODES.INVALID_ATTENDANCE_CREDENTIALS;
        }
        assert.strictEqual(noPinFailed, true, 'Teacher without PIN must be rejected');

        // Leading-zero PIN accepted
        const verified = await lessonAttendanceService.verifyTeacherPinByQr(qrTokenA, t1.id, '042819', '127.0.0.4');
        assert(verified.attendance_token, 'Attendance token must be issued for valid leading-zero PIN');
        recordResult('PIN verification (leading zero accepted, wrong PIN & no-PIN rejected)', 'PASS');

        // TEST 3: Subject & Lesson Periods for Submission
        const subject = await db.Subject.create({
            code: '__LA03_SUBJ',
            name: '__LA03 Matematika Uji',
            subject_type: 'UMUM',
            is_active: true
        });
        created.subjectId = subject.id;

        // Ensure we have an active template with at least 3 started periods and 1 future period
        const activeTemplate = await lessonAttendanceService.getActiveLessonPeriodTemplate();
        assert(activeTemplate, 'Active lesson period template must exist');

        // Create 3 temporary periods on active template with period_numbers 901, 902 (past/started), 903 (future 23:59:00)
        const p1 = await db.LessonPeriod.create({
            template_id: activeTemplate.id,
            period_order: 901,
            period_number: 901,
            name: '__LA03 Jam 901',
            period_type: 'LESSON',
            start_time: '00:01:00',
            end_time: '00:10:00',
            is_attendance_enabled: true,
            is_active: true
        });
        const p2 = await db.LessonPeriod.create({
            template_id: activeTemplate.id,
            period_order: 902,
            period_number: 902,
            name: '__LA03 Jam 902',
            period_type: 'LESSON',
            start_time: '00:11:00',
            end_time: '00:20:00',
            is_attendance_enabled: true,
            is_active: true
        });
        const pFuture = await db.LessonPeriod.create({
            template_id: activeTemplate.id,
            period_order: 903,
            period_number: 903,
            name: '__LA03 Jam 903 Future',
            period_type: 'LESSON',
            start_time: '23:58:00',
            end_time: '23:59:00',
            is_attendance_enabled: true,
            is_active: true
        });
        created.periodIds.push(p1.id, p2.id, pFuture.id);

        const attendanceAuthA = {
            teacher: { id: t1.id, full_name: t1.full_name, nip: t1.nip },
            classInfo: { id: clsA.id, name: clsA.name },
            academicYear: activeYear
        };

        // Upcoming/future period is now unlocked & allowed for submission
        const futureRes = await lessonAttendanceService.submitPublicAttendance({
            attendanceAuth: attendanceAuthA,
            subjectId: subject.id,
            lessonPeriodIds: [pFuture.id],
            students: rosterA.students.map((s) => ({ student_id: s.student_id, status: 'HADIR', notes: null })),
            ipAddress: '127.0.0.1'
        });
        assert.strictEqual(futureRes.total_sessions, 1, 'Upcoming period must be allowed');
        created.sessionIds.push(futureRes.periods[0].session_id);
        recordResult('Upcoming lesson period allowed (not locked by time)', 'PASS');

        // Missing student from payload -> 409 ATTENDANCE_ROSTER_CHANGED
        let missingRejected = false;
        try {
            await lessonAttendanceService.submitPublicAttendance({
                attendanceAuth: attendanceAuthA,
                subjectId: subject.id,
                lessonPeriodIds: [p1.id],
                students: rosterA.students.slice(0, 3).map((s) => ({ student_id: s.student_id, status: 'HADIR', notes: null })),
                ipAddress: '127.0.0.1'
            });
        } catch (err) {
            missingRejected = err.errorCode === ERROR_CODES.ATTENDANCE_ROSTER_CHANGED;
        }
        assert.strictEqual(missingRejected, true, 'Missing student in payload must trigger ATTENDANCE_ROSTER_CHANGED');

        // Foreign student from Class B in Class A payload -> 409 ATTENDANCE_ROSTER_CHANGED
        let foreignRejected = false;
        try {
            const payloadWithForeign = [
                ...rosterA.students.slice(0, 3).map((s) => ({ student_id: s.student_id, status: 'HADIR', notes: null })),
                { student_id: s3.id, status: 'HADIR', notes: null }
            ];
            await lessonAttendanceService.submitPublicAttendance({
                attendanceAuth: attendanceAuthA,
                subjectId: subject.id,
                lessonPeriodIds: [p1.id],
                students: payloadWithForeign,
                ipAddress: '127.0.0.1'
            });
        } catch (err) {
            foreignRejected = err.errorCode === ERROR_CODES.ATTENDANCE_ROSTER_CHANGED;
        }
        assert.strictEqual(foreignRejected, true, 'Foreign student in payload must trigger ATTENDANCE_ROSTER_CHANGED');
        recordResult('Roster tampering / mismatch rejected with ATTENDANCE_ROSTER_CHANGED', 'PASS');

        // Empty roster class rejected
        const attendanceAuthEmpty = {
            teacher: { id: t1.id, full_name: t1.full_name, nip: t1.nip },
            classInfo: { id: clsC.id, name: clsC.name },
            academicYear: activeYear
        };
        // Need QR active on clsC for inside-tx check
        await qrService.generateClassQr(clsC.id, null, '127.0.0.1');
        let emptyRejected = false;
        try {
            await lessonAttendanceService.submitPublicAttendance({
                attendanceAuth: attendanceAuthEmpty,
                subjectId: subject.id,
                lessonPeriodIds: [p1.id],
                students: [{ student_id: s1.id, status: 'HADIR', notes: null }],
                ipAddress: '127.0.0.1'
            });
        } catch (err) {
            emptyRejected = err.errorCode === ERROR_CODES.EMPTY_STUDENT_ROSTER;
        }
        assert.strictEqual(emptyRejected, true, 'Empty roster class must reject submission');
        recordResult('Empty roster class submission rejected', 'PASS');

        // TEST 4: Multi-period atomic submission & audit log
        const studentStatuses = [
            { student_id: s1.id, status: 'HADIR', notes: null },
            { student_id: s2.id, status: 'TERLAMBAT', notes: 'Telat 5 menit' },
            { student_id: s4.id, status: 'IZIN', notes: 'Lomba' },
            { student_id: s5.id, status: 'ALPA', notes: null }
        ];
        const submitRes = await lessonAttendanceService.submitPublicAttendance({
            attendanceAuth: attendanceAuthA,
            subjectId: subject.id,
            lessonPeriodIds: [p1.id, p2.id],
            students: studentStatuses,
            notes: 'Pertemuan uji LA-03',
            ipAddress: '127.0.0.1'
        });
        assert.strictEqual(submitRes.total_sessions, 2);
        assert.strictEqual(submitRes.total_students, 4);
        assert.strictEqual(submitRes.total_details, 8);
        assert.deepStrictEqual(submitRes.summary, { HADIR: 1, TERLAMBAT: 1, IZIN: 1, SAKIT: 0, ALPA: 1 });
        for (const p of submitRes.periods) {
            created.sessionIds.push(p.session_id);
        }

        const logs = await db.LessonAttendanceLog.findAll({
            where: {
                session_id: created.sessionIds,
                action: AUDIT_ACTIONS.ATTENDANCE_SUBMITTED
            }
        });
        assert.strictEqual(logs.length, created.sessionIds.length, 'Must create 1 ATTENDANCE_SUBMITTED audit log per session');
        recordResult('Multi-period atomic submission + details + audit logs', 'PASS');

        // TEST 5: Duplicate submission rejected
        let dupRejected = false;
        try {
            await lessonAttendanceService.submitPublicAttendance({
                attendanceAuth: attendanceAuthA,
                subjectId: subject.id,
                lessonPeriodIds: [p1.id],
                students: studentStatuses,
                ipAddress: '127.0.0.1'
            });
        } catch (err) {
            dupRejected = err.errorCode === ERROR_CODES.ATTENDANCE_ALREADY_EXISTS;
        }
        assert.strictEqual(dupRejected, true, 'Duplicate submission must be rejected with ATTENDANCE_ALREADY_EXISTS');
        recordResult('Duplicate attendance prevention', 'PASS');

        // TEST 6: Concurrent submission race condition (Class B, 1 student, same period)
        await qrService.generateClassQr(clsB.id, null, '127.0.0.1');
        const attendanceAuthB = {
            teacher: { id: t1.id, full_name: t1.full_name, nip: t1.nip },
            classInfo: { id: clsB.id, name: clsB.name },
            academicYear: activeYear
        };
        const concurrentOutcomes = await Promise.allSettled([
            lessonAttendanceService.submitPublicAttendance({
                attendanceAuth: attendanceAuthB,
                subjectId: subject.id,
                lessonPeriodIds: [p1.id],
                students: [{ student_id: s3.id, status: 'HADIR', notes: null }],
                ipAddress: '127.0.0.1'
            }),
            lessonAttendanceService.submitPublicAttendance({
                attendanceAuth: attendanceAuthB,
                subjectId: subject.id,
                lessonPeriodIds: [p1.id],
                students: [{ student_id: s3.id, status: 'ALPA', notes: null }],
                ipAddress: '127.0.0.1'
            })
        ]);
        const fulfilled = concurrentOutcomes.filter((o) => o.status === 'fulfilled');
        const rejected = concurrentOutcomes.filter((o) => o.status === 'rejected');
        assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent submission must succeed');
        created.sessionIds.push(fulfilled[0].value.periods[0].session_id);
        assert.strictEqual(rejected.length, 1, 'Exactly one concurrent submission must be rejected');
        assert.strictEqual(rejected[0].reason.errorCode, ERROR_CODES.ATTENDANCE_ALREADY_EXISTS, `Unexpected error: ${rejected[0].reason.message}`);
        recordResult('Concurrent submission race condition (1 succeeds, 1 rejected)', 'PASS');

        // TEST 7: Audit log failure causes full transaction rollback
        const origRecord = auditService.record;
        auditService.record = async () => {
            throw new Error('Simulated audit failure');
        };
        let rollbackWorked = false;
        try {
            await lessonAttendanceService.submitPublicAttendance({
                attendanceAuth: attendanceAuthB,
                subjectId: subject.id,
                lessonPeriodIds: [p2.id],
                students: [{ student_id: s3.id, status: 'HADIR', notes: null }],
                ipAddress: '127.0.0.1'
            });
        } catch (err) {
            rollbackWorked = err.message === 'Simulated audit failure';
        } finally {
            auditService.record = origRecord;
        }
        assert.strictEqual(rollbackWorked, true);
        const orphanSession = await db.LessonAttendanceSession.findOne({
            where: {
                academic_year_id: activeYear.id,
                class_id: clsB.id,
                lesson_period_id: p2.id
            }
        });
        assert.strictEqual(orphanSession, null, 'Session must be rolled back when audit fails');
        recordResult('Transaction rollback on audit log failure', 'PASS');

        console.log('\nALL LA-03 BACKEND TESTS PASSED!');
    } finally {
        // Clean up ONLY test-created rows
        try {
            if (created.sessionIds.length > 0) {
                await db.LessonAttendanceLog.destroy({ where: { session_id: created.sessionIds } });
                await db.LessonAttendanceDetail.destroy({ where: { session_id: created.sessionIds } });
                await db.LessonAttendanceSession.destroy({ where: { id: created.sessionIds } });
            }
            if (created.teacherIds.length > 0) {
                await db.LessonAttendanceLog.destroy({ where: { teacher_id: created.teacherIds } });
            }
            if (created.historyIds.length > 0) {
                await db.StudentClassHistory.destroy({ where: { id: created.historyIds } });
            }
            if (created.studentIds.length > 0) {
                await db.Student.destroy({ where: { id: created.studentIds } });
            }
            if (created.periodIds.length > 0) {
                await db.LessonPeriod.destroy({ where: { id: created.periodIds } });
            }
            if (created.subjectId) {
                await db.Subject.destroy({ where: { id: created.subjectId } });
            }
            if (created.classIds.length > 0) {
                await db.Class.destroy({ where: { id: created.classIds } });
            }
            if (created.teacherIds.length > 0) {
                await db.Teacher.destroy({ where: { id: created.teacherIds } });
            }
            if (created.userIds.length > 0) {
                await db.User.destroy({ where: { id: created.userIds } });
            }
            if (created.gradeId) {
                await db.Grade.destroy({ where: { id: created.gradeId } });
            }
        } catch (cleanupErr) {
            console.error('Cleanup error:', cleanupErr.message);
        }
        await db.sequelize.close();
    }
}

run().catch((err) => {
    console.error('TEST SUITE FAILED:', err);
    process.exit(1);
});
