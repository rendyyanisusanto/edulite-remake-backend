'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const assert = require('assert');
const ExcelJS = require('exceljs');
const db = require('../src/models');
const menuService = require('../src/modules/menus/menu.service');
const lessonAttendanceService = require('../src/modules/lesson-attendance/lesson-attendance.service');
const adminService = require('../src/modules/lesson-attendance/lesson-attendance-admin.service');
const dailyReportService = require('../src/modules/lesson-attendance/lesson-attendance-daily-report.service');
const dailyExportService = require('../src/modules/lesson-attendance/lesson-attendance-daily-export.service');
const { analyzeStudentDailySequence } = require('../src/modules/lesson-attendance/lesson-attendance-truancy.helper');

function record(name, status, detail = '') {
    console.log(`[${status}] ${name}${detail ? ` — ${detail}` : ''}`);
}

function makeSeq(codes) {
    const map = {
        H: 'HADIR',
        T: 'TERLAMBAT',
        I: 'IZIN',
        S: 'SAKIT',
        A: 'ALPA',
        '-': 'NOT_RECORDED',
        '?': 'MISSING_DETAIL',
        C: 'CANCELLED',
        U: 'UPCOMING'
    };
    return codes.map((c, idx) => ({ period_number: idx + 1, status: map[c] }));
}

async function cleanup() {
    await db.sequelize.query("DELETE FROM lesson_attendance_logs WHERE teacher_id IN (SELECT id FROM teachers WHERE full_name LIKE '__LA05%') OR session_id IN (SELECT id FROM lesson_attendance_sessions WHERE class_id IN (SELECT id FROM classes WHERE name LIKE '__LA05%'))");
    await db.sequelize.query("DELETE FROM lesson_attendance_details WHERE student_id IN (SELECT id FROM students WHERE nis LIKE 'LA05_%')");
    await db.sequelize.query("DELETE FROM lesson_attendance_sessions WHERE class_id IN (SELECT id FROM classes WHERE name LIKE '__LA05%')");
    await db.sequelize.query("DELETE FROM student_class_history WHERE student_id IN (SELECT id FROM students WHERE nis LIKE 'LA05_%')");
    await db.sequelize.query("DELETE FROM students WHERE nis LIKE 'LA05_%'");
    await db.sequelize.query("DELETE FROM subjects WHERE code LIKE '__LA05%'");
    await db.sequelize.query("DELETE FROM classes WHERE name LIKE '__LA05%'");
    await db.sequelize.query("DELETE FROM teachers WHERE full_name LIKE '__LA05%'");
    await db.sequelize.query("DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE username LIKE '__la05_%')");
    await db.sequelize.query("DELETE FROM users WHERE username LIKE '__la05_%'");
    await db.sequelize.query("DELETE FROM grades WHERE name LIKE '__LA05%'");
}

async function run() {
    try {
        await db.sequelize.authenticate();
        await cleanup();

        // 1. Unit tests for all 15+ truancy detection sequences
        const cases = [
            { seq: ['H', 'H', 'H', 'H'], truancy: false, periods: [] },
            { seq: ['H', 'H', 'A', 'A'], truancy: true, periods: [3, 4], ep: 'J3–J4' },
            { seq: ['H', 'A', 'H', 'H'], truancy: true, periods: [2], returned: true },
            { seq: ['H', 'A', 'H', 'A'], truancy: true, periods: [2, 4], ep: 'J2, J4' },
            { seq: ['T', 'H', 'A', 'H'], truancy: true, periods: [3], returned: true },
            { seq: ['A', 'A', 'H', 'H'], truancy: false, absentAtStart: true },
            { seq: ['A', 'A', 'A', 'A'], truancy: false, allAbsent: true },
            { seq: ['S', 'S', 'S', 'S'], truancy: false, periods: [] },
            { seq: ['H', 'I', 'I', 'H'], truancy: false, periods: [] },
            { seq: ['H', 'S', 'S', 'H'], truancy: false, periods: [] },
            { seq: ['H', '-', '-', 'H'], truancy: false, incomplete: true },
            { seq: ['H', '-', 'A', 'H'], truancy: true, periods: [3], ep: 'J3' },
            { seq: ['H', 'A', '-', 'A', 'H'], truancy: true, periods: [2, 4], ep: 'J2, J4' },
            { seq: ['-', '-', '-', '-'], truancy: false, recorded: 0 },
            { seq: ['H', 'A', 'I', 'H'], truancy: true, periods: [2], ep: 'J2' },
            { seq: ['H', 'C', 'U', '?'], truancy: false, incomplete: true }
        ];

        for (const tc of cases) {
            const res = analyzeStudentDailySequence(makeSeq(tc.seq));
            assert.strictEqual(res.potential_truancy, tc.truancy, `Failed truancy for ${tc.seq.join(' ')}`);
            if (tc.periods) assert.deepStrictEqual(res.potential_truancy_periods, tc.periods);
            if (tc.ep) assert.strictEqual(res.potential_truancy_episodes_text, tc.ep);
            if (tc.returned !== undefined) assert.strictEqual(res.returned_after_absence, tc.returned);
            if (tc.absentAtStart !== undefined) assert.strictEqual(res.absent_at_start, tc.absentAtStart);
            if (tc.allAbsent !== undefined) assert.strictEqual(res.all_recorded_periods_absent, tc.allAbsent);
            if (tc.incomplete !== undefined) assert.strictEqual(res.incomplete_attendance, tc.incomplete);
            if (tc.recorded !== undefined) assert.strictEqual(res.recorded_period_count, tc.recorded);
        }
        record('Truancy Detection Sequences (16 cases)', 'PASS', 'All sequence & episode rules verified');

        // 2. Menu order & RBAC verification
        const [laMenus] = await db.sequelize.query(
            `SELECT m.name, m.route, m.sort_order, m.permission_code
             FROM menus m
             JOIN menu_groups mg ON mg.id = m.group_id
             WHERE mg.name = 'Presensi Jam Pelajaran'
             ORDER BY m.sort_order ASC`
        );
        assert.strictEqual(laMenus.length, 4);
        assert.deepStrictEqual(
            laMenus.map((m) => m.name),
            ['Monitoring', 'Data Presensi', 'Laporan Harian Siswa', 'Laporan Presensi']
        );

        const tatibRole = await db.Role.findOne({ where: { name: 'TATIB' } });
        const guruRole = await db.Role.findOne({ where: { name: 'GURU' } });
        const userTatib = await db.User.create({ name: '__LA05 Tatib', username: '__la05_tatib', email: '__la05_t@test.local', password_hash: 'x', is_active: true });
        const userGuru = await db.User.create({ name: '__LA05 Guru', username: '__la05_guru', email: '__la05_g@test.local', password_hash: 'x', is_active: true });
        if (tatibRole) await db.UserRole.create({ user_id: userTatib.id, role_id: tatibRole.id });
        if (guruRole) await db.UserRole.create({ user_id: userGuru.id, role_id: guruRole.id });

        if (tatibRole) {
            const tMenus = await menuService.getMenuForUser(userTatib.id);
            const tGroup = tMenus.find((g) => g.name === 'Presensi Jam Pelajaran');
            assert(tGroup && tGroup.menus.some((m) => m.name === 'Laporan Harian Siswa'), 'TATIB must see Laporan Harian Siswa');
        }
        if (guruRole) {
            const gMenus = await menuService.getMenuForUser(userGuru.id);
            const gGroup = gMenus.find((g) => g.name === 'Presensi Jam Pelajaran');
            assert(!gGroup || !gGroup.menus.some((m) => m.name === 'Laporan Harian Siswa'), 'GURU must not automatically get daily_report');
        }
        record('Menu Ordering & RBAC Assignment', 'PASS', 'Ordered after Data Presensi, before Laporan Presensi');

        // 3. Integration: Active roster + Multi-period + Correction dynamic update + Export
        const activeYear = await lessonAttendanceService.getActiveAcademicYear();
        const { attendanceDate: today } = lessonAttendanceService.getServerDateTimeInTimezone();
        const adminUser = await db.User.findOne({ order: [['id', 'ASC']] });

        const grade = await db.Grade.create({ name: '__LA05_X', level: 98 });
        const clsA = await db.Class.create({ name: '__LA05_X_A', grade_id: grade.id });
        const clsB = await db.Class.create({ name: '__LA05_X_B', grade_id: grade.id });
        const uT = await db.User.create({ name: '__LA05 Teacher', username: '__la05_tch', email: '__la05_tch@test.local', password_hash: 'x', is_active: true });
        const teacher = await db.Teacher.create({ user_id: uT.id, full_name: '__LA05_Guru', nip: '998001' });
        const subject = await db.Subject.create({ code: '__LA05_IPA', name: '__LA05 IPA', subject_type: 'UMUM', is_active: true });

        const stActive1 = await db.Student.create({ nis: 'LA05_001', full_name: '=CMD() Siswa Bolos', student_status: 'ACTIVE' });
        const stActive2 = await db.Student.create({ nis: 'LA05_002', full_name: '__LA05 Siswa Rajin', student_status: 'ACTIVE' });
        const stMoved = await db.Student.create({ nis: 'LA05_003', full_name: '__LA05 Siswa Pindah', student_status: 'ACTIVE' });

        await db.StudentClassHistory.create({ student_id: stActive1.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'INITIAL' });
        await db.StudentClassHistory.create({ student_id: stActive2.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'INITIAL' });
        await db.StudentClassHistory.create({ student_id: stMoved.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsA.id, assignment_type: 'INITIAL' });
        await db.StudentClassHistory.create({ student_id: stMoved.id, academic_year_id: activeYear.id, grade_id: grade.id, class_id: clsB.id, assignment_type: 'TRANSFER' });

        const { periods } = await lessonAttendanceService.getAvailableLessonPeriods('23:59:59');
        assert(periods.length >= 2, 'Need at least 2 active periods');
        const p1 = periods[0];
        const p2 = periods[1];

        // Create 2 sessions on today: J1 (both HADIR), J2 (stActive1 = ALPA, stActive2 = HADIR)
        const sess1 = await db.LessonAttendanceSession.create({
            academic_year_id: activeYear.id,
            class_id: clsA.id,
            teacher_id: teacher.id,
            subject_id: subject.id,
            lesson_period_id: p1.id,
            attendance_date: today,
            period_number: p1.period_number,
            period_start_time: p1.start_time,
            period_end_time: p1.end_time,
            input_method: 'QR'
        });
        const sess2 = await db.LessonAttendanceSession.create({
            academic_year_id: activeYear.id,
            class_id: clsA.id,
            teacher_id: teacher.id,
            subject_id: subject.id,
            lesson_period_id: p2.id,
            attendance_date: today,
            period_number: p2.period_number,
            period_start_time: p2.start_time,
            period_end_time: p2.end_time,
            input_method: 'QR'
        });
        await db.LessonAttendanceDetail.bulkCreate([
            { session_id: sess1.id, student_id: stActive1.id, status: 'HADIR' },
            { session_id: sess1.id, student_id: stActive2.id, status: 'HADIR' },
            { session_id: sess2.id, student_id: stActive1.id, status: 'ALPA' },
            { session_id: sess2.id, student_id: stActive2.id, status: 'HADIR' }
        ]);

        // Query daily matrix for clsA
        const mat1 = await dailyReportService.buildDailyMatrix({
            academic_year_id: activeYear.id,
            attendance_date: today,
            class_id: clsA.id
        });
        assert.strictEqual(mat1.base_summary.total_students, 2, 'Moved student must not appear in clsA active roster');
        assert.strictEqual(mat1.base_summary.potential_truancy_count, 1, 'stActive1 must be flagged as potential truancy');
        assert.strictEqual(mat1.column_totals[p2.period_number].A, 1);

        // Quick filter: POTENTIAL_TRUANCY
        const matFiltered = await dailyReportService.buildDailyMatrix({
            academic_year_id: activeYear.id,
            attendance_date: today,
            class_id: clsA.id,
            attendance_condition: 'POTENTIAL_TRUANCY'
        });
        assert.strictEqual(matFiltered.students.length, 1);
        assert.strictEqual(matFiltered.students[0].student_id, stActive1.id);
        assert.strictEqual(matFiltered.base_summary.total_students, 2, 'base_summary must keep total monitored students');
        record('Daily Matrix, Active Roster & Quick Filter', 'PASS', '2 active students, 1 truancy detected & filtered');

        // Correct ALPA -> IZIN on sess2 and verify truancy clears dynamically
        await adminService.correctSession({
            sessionId: sess2.id,
            students: [
                { student_id: stActive1.id, status: 'IZIN', notes: 'Dispensasi' },
                { student_id: stActive2.id, status: 'HADIR' }
            ],
            reason: 'Ada dispensasi',
            actorUserId: adminUser.id
        });
        const matAfter = await dailyReportService.buildDailyMatrix({
            academic_year_id: activeYear.id,
            attendance_date: today,
            class_id: clsA.id
        });
        assert.strictEqual(matAfter.base_summary.potential_truancy_count, 0, 'Correction ALPA->IZIN must clear truancy dynamically');
        record('Dynamic Re-Evaluation After Correction', 'PASS', 'ALPA->IZIN cleared potential_truancy_count to 0');

        // Revert back to ALPA for export test
        await db.LessonAttendanceDetail.update({ status: 'ALPA' }, { where: { session_id: sess2.id, student_id: stActive1.id } });

        // Excel Export (2 sheets + formula sanitization)
        const excelRes = await dailyExportService.generateExcel({
            academic_year_id: activeYear.id,
            attendance_date: today,
            class_id: clsA.id
        }, adminUser.id);
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(excelRes.buffer);
        const ws1 = wb.getWorksheet('Laporan Harian');
        const ws2 = wb.getWorksheet('Indikasi Bolos');
        assert(ws1 && ws2, 'Excel must have both Laporan Harian and Indikasi Bolos sheets');
        let sanitized = false;
        ws1.eachRow((r) => r.eachCell((c) => { if (typeof c.value === 'string' && c.value.startsWith("'=CMD")) sanitized = true; }));
        assert(sanitized, 'Formula injection must be sanitized');
        record('Excel Export (2 Sheets & Formula Sanitization)', 'PASS', `${excelRes.filename} (${excelRes.buffer.length} bytes)`);

        // PDF Export
        const pdfRes = await dailyExportService.generatePdf({
            academic_year_id: activeYear.id,
            attendance_date: today,
            class_id: clsA.id
        }, adminUser.id);
        assert(pdfRes.buffer.slice(0, 4).toString() === '%PDF', 'PDF must be valid');
        record('PDF Export Generation', 'PASS', `${pdfRes.filename} (${pdfRes.buffer.length} bytes)`);

        await cleanup();
        console.log('\nALL LA-05 TESTS PASSED!');
        process.exit(0);
    } catch (err) {
        console.error('TEST FAILED:', err);
        try { await cleanup(); } catch {}
        process.exit(1);
    }
}

run();
