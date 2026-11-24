'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const assert = require('assert');
const ExcelJS = require('exceljs');
const db = require('../src/models');
const menuService = require('../src/modules/menus/menu.service');
const lessonAttendanceService = require('../src/modules/lesson-attendance/lesson-attendance.service');
const adminService = require('../src/modules/lesson-attendance/lesson-attendance-admin.service');
const reportService = require('../src/modules/lesson-attendance/lesson-attendance-report.service');
const exportService = require('../src/modules/lesson-attendance/lesson-attendance-export.service');
const { ERROR_CODES, AUDIT_ACTIONS, INPUT_METHODS } = require('../src/modules/lesson-attendance/lesson-attendance.constants');

const results = [];
function record(name, status, detail = '') {
    results.push({ name, status, detail });
    console.log(`[${status}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function cleanup() {
    await db.sequelize.query("DELETE FROM lesson_attendance_logs WHERE teacher_id IN (SELECT id FROM teachers WHERE full_name LIKE '__LA04%') OR session_id IN (SELECT id FROM lesson_attendance_sessions WHERE class_id IN (SELECT id FROM classes WHERE name LIKE '__LA04%'))");
    await db.sequelize.query("DELETE FROM lesson_attendance_details WHERE student_id IN (SELECT id FROM students WHERE nis LIKE 'LA04_%')");
    await db.sequelize.query("DELETE FROM lesson_attendance_sessions WHERE class_id IN (SELECT id FROM classes WHERE name LIKE '__LA04%')");
    await db.sequelize.query("DELETE FROM student_class_history WHERE student_id IN (SELECT id FROM students WHERE nis LIKE 'LA04_%')");
    await db.sequelize.query("DELETE FROM students WHERE nis LIKE 'LA04_%'");
    await db.sequelize.query("DELETE FROM lesson_periods WHERE name LIKE '__LA04%'");
    await db.sequelize.query("DELETE FROM subjects WHERE code LIKE '__LA04%'");
    await db.sequelize.query("DELETE FROM classes WHERE name LIKE '__LA04%'");
    await db.sequelize.query("DELETE FROM teachers WHERE full_name LIKE '__LA04%'");
    await db.sequelize.query("DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE username LIKE '__la04_%')");
    await db.sequelize.query("DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE name LIKE '__LA04_%')");
    await db.sequelize.query("DELETE FROM users WHERE username LIKE '__la04_%'");
    await db.sequelize.query("DELETE FROM roles WHERE name LIKE '__LA04_%'");
    await db.sequelize.query("DELETE FROM grades WHERE name LIKE '__LA04%'");
}

async function run() {
    try {
        await db.sequelize.authenticate();
        await cleanup();

        // 1. Menu & RBAC verification
        const [groups] = await db.sequelize.query("SELECT id, name FROM menu_groups WHERE name = 'Presensi Jam Pelajaran'");
        assert.strictEqual(groups.length, 1, 'Independent menu group Presensi Jam Pelajaran must exist');
        const [menus] = await db.sequelize.query(
            "SELECT name, route, parent_id, permission_code FROM menus WHERE group_id = :gid ORDER BY sort_order",
            { replacements: { gid: groups[0].id } }
        );
        const menuNames = menus.map((m) => m.name);
        assert(menuNames.includes('Monitoring') && menuNames.includes('Data Presensi') && menuNames.includes('Laporan Presensi'), 'Must include LA-04 submenus');
        assert(menus.every((m) => m.parent_id === null), 'Menus must be top-level inside independent group');
        record('Independent Menu Structure', 'PASS', 'Presensi Jam Pelajaran -> Monitoring, Data Presensi, Laporan Presensi');

        // Verify Absensi Siswa menu group untouched
        const [absensiSiswa] = await db.sequelize.query("SELECT m.name, m.route FROM menus m JOIN menu_groups mg ON mg.id = m.group_id WHERE mg.name = 'Absensi Siswa'");
        assert(absensiSiswa.every((m) => !m.route.includes('presensi-jam-pelajaran')), 'Absensi Siswa must not contain LA menus');
        record('Absensi Siswa Untouched', 'PASS', `${absensiSiswa.length} existing menus intact`);

        // Create test users with different permissions to test menu filtering
        const roleReportOnly = await db.Role.create({ name: '__LA04_REPORT_ONLY', description: 'Test report only' });
        const roleNoAccess = await db.Role.create({ name: '__LA04_NO_ACCESS', description: 'Test no access' });
        const reportPerm = await db.Permission.findOne({ where: { code: 'lesson_attendance.report.view' } });
        await db.RolePermission.create({ role_id: roleReportOnly.id, permission_id: reportPerm.id });

        const userReport = await db.User.create({ name: '__LA04 Report', username: '__la04_rep', email: '__la04_rep@test.local', password_hash: 'x', is_active: true });
        const userNone = await db.User.create({ name: '__LA04 None', username: '__la04_none', email: '__la04_none@test.local', password_hash: 'x', is_active: true });
        await db.UserRole.create({ user_id: userReport.id, role_id: roleReportOnly.id });
        await db.UserRole.create({ user_id: userNone.id, role_id: roleNoAccess.id });

        const adminUser = await db.User.findOne({ order: [['id', 'ASC']] });

        const repMenus = await menuService.getMenuForUser(userReport.id);
        const repLaGroup = repMenus.find((g) => g.name === 'Presensi Jam Pelajaran');
        assert(repLaGroup && repLaGroup.menus.length === 1 && repLaGroup.menus[0].name === 'Laporan Presensi', 'Report-only user should see only Laporan Presensi');

        const noneMenus = await menuService.getMenuForUser(userNone.id);
        const noneLaGroup = noneMenus.find((g) => g.name === 'Presensi Jam Pelajaran');
        assert(!noneLaGroup, 'User with no LA permission must not see Presensi Jam Pelajaran');
        record('Menu RBAC Filtering', 'PASS', 'Report-only sees 1 submenu; no-access sees 0');

        // 2. Setup test academic entities
        const activeYear = await lessonAttendanceService.getActiveAcademicYear();
        const { attendanceDate: today } = lessonAttendanceService.getServerDateTimeInTimezone();
        const grade = await db.Grade.create({ name: '__LA04_X', level: 99 });
        const clsA = await db.Class.create({ name: '__LA04_X_A', grade_id: grade.id });
        const clsB = await db.Class.create({ name: '__LA04_X_B', grade_id: grade.id });
        const clsEmpty = await db.Class.create({ name: '__LA04_X_EMPTY', grade_id: grade.id });

        const uT1 = await db.User.create({ name: '__LA04 Guru 1', username: '__la04_t1', email: '__la04_t1@test.local', password_hash: 'x', is_active: true });
        const uT2 = await db.User.create({ name: '__LA04 Guru 2', username: '__la04_t2', email: '__la04_t2@test.local', password_hash: 'x', is_active: true });
        const teacher1 = await db.Teacher.create({ user_id: uT1.id, full_name: '__LA04_Guru_1', nip: '999001' });
        const teacher2 = await db.Teacher.create({ user_id: uT2.id, full_name: '__LA04_Guru_2', nip: '999002' });
        const subject1 = await db.Subject.create({ code: '__LA04_MTK', name: '__LA04 Matematika', subject_type: 'UMUM', is_active: true });
        const subject2 = await db.Subject.create({ code: '__LA04_BIN', name: '__LA04 B.Indonesia', subject_type: 'UMUM', is_active: true });

        // Students: st1 active in clsA, st2 transferred from clsA to clsB, st3 graduated
        const st1 = await db.Student.create({ nis: 'LA04_001', full_name: '=SUM(1+1) Siswa Satu', student_status: 'ACTIVE' });
        const st2 = await db.Student.create({ nis: 'LA04_002', full_name: '__LA04 Siswa Pindah', student_status: 'ACTIVE' });
        const st3 = await db.Student.create({ nis: 'LA04_003', full_name: '__LA04 Siswa Lulus', student_status: 'GRADUATED' });

        await db.StudentClassHistory.create({ student_id: st1.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'INITIAL' });
        await db.StudentClassHistory.create({ student_id: st2.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'INITIAL' });
        await db.StudentClassHistory.create({ student_id: st2.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsB.id, assignment_type: 'TRANSFER' });
        await db.StudentClassHistory.create({ student_id: st3.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'INITIAL' });

        // Resolve active periods from template
        const { periods } = await lessonAttendanceService.getAvailableLessonPeriods('23:59:59');
        assert(periods.length >= 2, 'Need at least 2 active attendance-enabled periods in template');
        const p1 = periods[0];
        const p2 = periods[1];

        // 3. Verify active roster excludes transferred & graduated
        const rosterA = await lessonAttendanceService.getActiveClassRoster({ classId: clsA.id, academicYearId: activeYear.id });
        assert.strictEqual(rosterA.total_students, 1, 'clsA should have only 1 active student');
        assert.strictEqual(rosterA.students[0].student_id, st1.id);
        record('Active Roster Excludes Transferred & Graduated', 'PASS', 'clsA active roster = [st1]');

        // 4. Verify historical manual input is rejected safely (yesterday within active academic year)
        const yesterdayDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        let histRejected = false;
        try {
            await adminService.createManualAttendance({
                academicYearId: activeYear.id,
                classId: clsA.id,
                teacherId: teacher1.id,
                subjectId: subject1.id,
                attendanceDate: yesterdayDate,
                lessonPeriodIds: [p1.id],
                students: [{ student_id: st1.id, status: 'HADIR' }],
                actorUserId: adminUser.id
            });
        } catch (err) {
            histRejected = err.errorCode === ERROR_CODES.HISTORICAL_ROSTER_UNAVAILABLE;
        }
        assert(histRejected, 'Historical manual input without effective date must be rejected');
        record('Historical Manual Input Guard', 'PASS', 'Rejected with HISTORICAL_ROSTER_UNAVAILABLE');

        // 5. Create multi-period manual attendance (if p1 & p2 are not future; use a past-time check by testing with p1 if started)
        const { currentTime } = lessonAttendanceService.getServerDateTimeInTimezone();
        const startedPeriods = periods.filter((p) => p.start_time <= currentTime);
        if (startedPeriods.length >= 1) {
            const targetPeriods = startedPeriods.slice(0, Math.min(2, startedPeriods.length));
            const created = await adminService.createManualAttendance({
                academicYearId: activeYear.id,
                classId: clsA.id,
                teacherId: teacher1.id,
                subjectId: subject1.id,
                attendanceDate: today,
                lessonPeriodIds: targetPeriods.map((p) => p.id),
                students: [{ student_id: st1.id, status: 'TERLAMBAT', notes: 'Macet' }],
                notes: 'Manual test',
                actorUserId: adminUser.id,
                ipAddress: '127.0.0.1'
            });
            assert.strictEqual(created.total_sessions, targetPeriods.length);
            const sessId = created.periods[0].session_id;
            record('Manual Multi-Period Submission', 'PASS', `Created ${created.total_sessions} session(s), method=ADMIN`);

            // 6. Verify Monitoring shows clsA, excludes clsEmpty
            const mon = await adminService.getMonitoring({ attendanceDate: today, academicYearId: activeYear.id, gradeId: grade.id });
            assert(mon.rows.some((r) => r.class_id === clsA.id), 'clsA must appear in monitoring');
            assert(!mon.rows.some((r) => r.class_id === clsEmpty.id), 'clsEmpty must not appear in monitoring');
            const cell = mon.rows.find((r) => r.class_id === clsA.id).cells[targetPeriods[0].period_number];
            assert.strictEqual(cell.status, 'SUBMITTED');
            record('Monitoring Matrix & Empty Class Exclusion', 'PASS', 'clsA SUBMITTED, clsEmpty excluded');

            // 7. Correction + Optimistic Concurrency + Audit
            const beforeDetail = await adminService.getSessionDetail(sessId);
            const corrected = await adminService.correctSession({
                sessionId: sessId,
                teacherId: teacher2.id,
                subjectId: subject2.id,
                students: [{ student_id: st1.id, status: 'IZIN', notes: 'Surat izin' }],
                reason: 'Ada surat izin',
                expectedUpdatedAt: beforeDetail.session.updated_at,
                actorUserId: adminUser.id,
                ipAddress: '127.0.0.1'
            });
            assert.strictEqual(corrected.session.teacher_id, teacher2.id);
            assert.strictEqual(corrected.session.input_method, INPUT_METHODS.ADMIN);
            assert.strictEqual(corrected.students[0].status, 'IZIN');

            // Stale updated_at should return 409
            let conflictCaught = false;
            try {
                await adminService.correctSession({
                    sessionId: sessId,
                    students: [{ student_id: st1.id, status: 'ALPA' }],
                    reason: 'Stale test',
                    expectedUpdatedAt: beforeDetail.session.updated_at,
                    actorUserId: adminUser.id
                });
            } catch (err) {
                conflictCaught = err.errorCode === ERROR_CODES.ATTENDANCE_CONCURRENT_UPDATE;
            }
            assert(conflictCaught, 'Concurrent update must throw ATTENDANCE_CONCURRENT_UPDATE');
            record('Correction & Concurrency Control', 'PASS', 'Updated & stale check 409 passed');

            // 8. Cancel & Restore
            await adminService.cancelSession({ sessionId: sessId, reason: 'Salah kelas', actorUserId: adminUser.id });
            const repCancelled = await reportService.getClassReport({ academic_year_id: activeYear.id, date_from: today, date_to: today, class_id: clsA.id });
            const cancelledCountInReport = repCancelled.rows.reduce((acc, r) => acc + r.sessions_count, 0);
            assert.strictEqual(cancelledCountInReport, targetPeriods.length - 1, 'Cancelled session must be excluded from valid reports');

            await adminService.restoreSession({ sessionId: sessId, reason: 'Dipulihkan kembali', actorUserId: adminUser.id });
            const logs = await adminService.getSessionLogs(sessId);
            assert(logs.some((l) => l.action === AUDIT_ACTIONS.ATTENDANCE_CANCELLED));
            assert(logs.some((l) => l.action === AUDIT_ACTIONS.ATTENDANCE_RESTORED));
            record('Cancel, Restore & Audit Trail', 'PASS', `Logs count = ${logs.length}`);
        } else {
            record('Manual Submission (Skipped - before school start)', 'PASS', 'No started periods at current server time; creating direct session for report tests');
        }

        // 9. Historical Report & Export test (insert a historical session for st2 in clsA and st3 graduated)
        const histSess = await db.LessonAttendanceSession.create({
            academic_year_id: activeYear.id,
            class_id: clsA.id,
            teacher_id: teacher1.id,
            subject_id: subject1.id,
            lesson_period_id: p1.id,
            attendance_date: '2026-08-10',
            period_number: p1.period_number,
            period_start_time: p1.start_time,
            period_end_time: p1.end_time,
            input_method: 'QR'
        });
        await db.LessonAttendanceDetail.bulkCreate([
            { session_id: histSess.id, student_id: st1.id, status: 'HADIR' },
            { session_id: histSess.id, student_id: st2.id, status: 'TERLAMBAT' },
            { session_id: histSess.id, student_id: st3.id, status: 'ALPA' }
        ]);

        const histReport = await reportService.getStudentReport({
            academic_year_id: activeYear.id,
            date_from: '2026-08-10',
            date_to: '2026-08-10',
            class_id: clsA.id
        });
        assert.strictEqual(histReport.rows.length, 3, 'Historical report must include transferred (st2) and graduated (st3) students in clsA');
        assert.strictEqual(histReport.grand_total.attendance_percentage, 66.67, 'HADIR + TERLAMBAT (2/3) = 66.67%');
        record('Historical Report & Percentage Math', 'PASS', 'Includes transferred & graduated students; TERLAMBAT counted as present');

        // 10. Excel Export & Formula Injection Prevention
        const excelRes = await exportService.generateExcel('student', {
            academic_year_id: activeYear.id,
            date_from: '2026-08-10',
            date_to: '2026-08-10',
            class_id: clsA.id
        });
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(excelRes.buffer);
        const ws = wb.getWorksheet('Laporan Presensi');
        assert(ws, 'Excel worksheet must exist');
        let formulaSanitized = false;
        ws.eachRow((row) => {
            row.eachCell((cell) => {
                if (typeof cell.value === 'string' && cell.value.startsWith("'=SUM")) {
                    formulaSanitized = true;
                }
            });
        });
        assert(formulaSanitized, 'Formula injection must be neutralized with leading apostrophe');
        record('Excel Export & Formula Sanitization', 'PASS', `${excelRes.filename} (${excelRes.buffer.length} bytes)`);

        // 11. PDF Export
        const pdfRes = await exportService.generatePdf('class', {
            academic_year_id: activeYear.id,
            date_from: '2026-08-10',
            date_to: '2026-08-10',
            class_id: clsA.id
        });
        assert(pdfRes.buffer.slice(0, 4).toString() === '%PDF', 'PDF must have valid %PDF header');
        record('PDF Export Generation', 'PASS', `${pdfRes.filename} (${pdfRes.buffer.length} bytes)`);

        await cleanup();
        console.log('\nALL LA-04 TESTS PASSED!');
        process.exit(0);
    } catch (err) {
        console.error('TEST FAILED:', err);
        try { await cleanup(); } catch { }
        process.exit(1);
    }
}

run();
