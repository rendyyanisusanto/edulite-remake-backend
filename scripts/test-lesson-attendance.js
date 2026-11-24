/* eslint-disable no-console */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const db = require('../src/models');
const pinService = require('../src/modules/lesson-attendance/lesson-attendance-pin.service');
const qrService = require('../src/modules/lesson-attendance/lesson-attendance-qr.service');
const lessonAttendanceService = require('../src/modules/lesson-attendance/lesson-attendance.service');

async function startServer() {
    return new Promise((resolve) => {
        const server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => {
            const addr = server.address();
            resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
        });
    });
}

async function apiReq(baseUrl, path, { method = 'GET', headers = {}, body = null } = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: body ? JSON.stringify(body) : undefined
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, headers: res.headers, body: json };
}

async function run() {
    const results = [];
    const record = (name, ok, detail = '') => {
        results.push({ name, ok, detail });
        console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' -> ' + detail : ''}`);
        if (!ok) throw new Error(`Test failed: ${name} (${detail})`);
    };

    const { server, baseUrl } = await startServer();

    // Pick an existing teacher, class, and superadmin user without mutating permanently
    const adminRole = await db.Role.findOne({ where: { name: 'SUPERADMIN' } });
    const adminUserRole = await db.UserRole.findOne({ where: { role_id: adminRole.id } });
    const adminUser = await db.User.findByPk(adminUserRole.user_id);
    const adminJwt = jwt.sign(
        { id: adminUser.id, username: adminUser.username, email: adminUser.email, roles: ['SUPERADMIN'] },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
    );

    const teacher = await db.Teacher.scope('withPinHash').findOne({ order: [['id', 'ASC']] });
    const cls = await db.Class.scope('withAttendanceToken').findOne({ order: [['id', 'ASC']] });
    assert(teacher && cls, 'Existing teacher and class must exist in DB');

    const origPinHash = teacher.attendance_pin_hash;
    const origQrToken = cls.attendance_token;
    const origQrActive = cls.attendance_qr_active;
    const createdLogIdsBefore = (await db.LessonAttendanceLog.max('id')) || 0;
    const createdSessionIdsBefore = (await db.LessonAttendanceSession.max('id')) || 0;

    try {
        // 1. General API sensitive field protection
        const teachersRes = await apiReq(baseUrl, '/api/academic/teachers?limit=5', {
            headers: { Authorization: `Bearer ${adminJwt}` }
        });
        assert.strictEqual(teachersRes.status, 200);
        const firstTeacher = teachersRes.body.data.teachers[0];
        assert.strictEqual('attendance_pin_hash' in firstTeacher, false, 'attendance_pin_hash must not be exposed');
        assert.strictEqual('attendance_pin_configured' in firstTeacher, true, 'attendance_pin_configured must be present');
        record('General Teacher API hides attendance_pin_hash & includes status', true);

        const classesRes = await apiReq(baseUrl, '/api/academic/classes?limit=5', {
            headers: { Authorization: `Bearer ${adminJwt}` }
        });
        assert.strictEqual(classesRes.status, 200);
        const firstClass = classesRes.body.data.classes[0];
        assert.strictEqual('attendance_token' in firstClass, false, 'attendance_token must not be exposed');
        assert.strictEqual('attendance_qr_configured' in firstClass, true, 'attendance_qr_configured must be present');
        record('General Class API hides attendance_token & includes status', true);

        // 2. Unauthorized access blocked
        const unauthPin = await apiReq(baseUrl, `/api/teachers/${teacher.id}/attendance-pin/status`);
        assert.strictEqual(unauthPin.status, 401);
        const unauthQr = await apiReq(baseUrl, `/api/classes/${cls.id}/attendance-qr`);
        assert.strictEqual(unauthQr.status, 401);
        record('Unauthorized admin PIN/QR endpoints return 401', true);

        // 3. Generate Teacher PIN & Leading zero manual PIN
        const genPinRes = await apiReq(baseUrl, `/api/teachers/${teacher.id}/attendance-pin/generate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminJwt}` }
        });
        assert.strictEqual(genPinRes.status, 200);
        assert.match(genPinRes.body.data.pin, /^\d{6}$/);
        assert.strictEqual(genPinRes.headers.get('cache-control'), 'no-store');
        record('Generate Teacher PIN returns 6-digit PIN with no-store', true);

        const weakPinRes = await apiReq(baseUrl, `/api/teachers/${teacher.id}/attendance-pin`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminJwt}` },
            body: { pin: '123456' }
        });
        assert.strictEqual(weakPinRes.status, 400);
        record('Weak manual PIN (123456) rejected with 400', true);

        const leadingZeroPin = '038521';
        const setPinRes = await apiReq(baseUrl, `/api/teachers/${teacher.id}/attendance-pin`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminJwt}` },
            body: { pin: leadingZeroPin }
        });
        assert.strictEqual(setPinRes.status, 200);
        record('Manual PIN with leading zero (038521) accepted', true);

        // 4. Classroom QR lifecycle
        // Ensure clean state first for test class
        await db.Class.scope('withAttendanceToken').update(
            { attendance_token: null, attendance_qr_active: false },
            { where: { id: cls.id } }
        );
        const genQrRes = await apiReq(baseUrl, `/api/classes/${cls.id}/attendance-qr/generate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminJwt}` }
        });
        assert.strictEqual(genQrRes.status, 201);
        const qrUrl1 = genQrRes.body.data.qr_url;
        const token1 = qrUrl1.split('/presensi-kelas/')[1];
        assert.match(token1, /^[a-f0-9]{64}$/);
        record('Generate Classroom QR creates 64-char secure token', true);

        const dupQrRes = await apiReq(baseUrl, `/api/classes/${cls.id}/attendance-qr/generate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminJwt}` }
        });
        assert.strictEqual(dupQrRes.status, 409);
        record('Duplicate QR generate returns 409', true);

        // Deactivate QR
        const deactRes = await apiReq(baseUrl, `/api/classes/${cls.id}/attendance-qr/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminJwt}` },
            body: { is_active: false }
        });
        assert.strictEqual(deactRes.status, 200);
        const resolveInactive = await apiReq(baseUrl, `/api/public/lesson-attendance/classes/${token1}`);
        assert.strictEqual(resolveInactive.status, 403);
        assert.strictEqual(resolveInactive.body.error_code, 'ATTENDANCE_QR_INACTIVE');
        record('Deactivated QR is rejected on public resolve (403)', true);

        // Reactivate QR (same token)
        const actRes = await apiReq(baseUrl, `/api/classes/${cls.id}/attendance-qr/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminJwt}` },
            body: { is_active: true }
        });
        assert.strictEqual(actRes.status, 200);
        assert.strictEqual(actRes.body.data.qr_url, qrUrl1);
        const resolveActive = await apiReq(baseUrl, `/api/public/lesson-attendance/classes/${token1}`);
        assert.strictEqual(resolveActive.status, 200);
        assert.strictEqual('students' in resolveActive.body.data, false, 'No student data before PIN verify');
        record('Reactivated QR preserves token & public resolve hides student roster', true);

        // 5. Public PIN Verification & Token Isolation
        const verifyRes = await apiReq(baseUrl, `/api/public/lesson-attendance/classes/${token1}/verify-pin`, {
            method: 'POST',
            body: { teacher_id: teacher.id, pin: leadingZeroPin }
        });
        assert.strictEqual(verifyRes.status, 200);
        const attToken = verifyRes.body.data.attendance_token;
        assert(attToken, 'Attendance token issued');
        record('Public PIN verification issues attendance token', true);

        // Context endpoint works with attendance token
        const ctxRes = await apiReq(baseUrl, '/api/public/lesson-attendance/context', {
            headers: { Authorization: `Bearer ${attToken}` }
        });
        assert.strictEqual(ctxRes.status, 200);
        assert.strictEqual(ctxRes.body.data.teacher.id, teacher.id);
        assert.strictEqual(ctxRes.body.data.class_info.id, cls.id);
        assert(Array.isArray(ctxRes.body.data.student_roster));
        record('Public context returns verified teacher, class, periods, and roster', true);

        // Attendance token rejected on admin API
        const adminWithAtt = await apiReq(baseUrl, '/api/academic/teachers', {
            headers: { Authorization: `Bearer ${attToken}` }
        });
        assert.strictEqual(adminWithAtt.status, 401);
        record('Attendance token rejected on admin API (401)', true);

        // Admin JWT rejected on attendance context API
        const ctxWithAdmin = await apiReq(baseUrl, '/api/public/lesson-attendance/context', {
            headers: { Authorization: `Bearer ${adminJwt}` }
        });
        assert.strictEqual(ctxWithAdmin.status, 401);
        record('Admin JWT rejected on attendance context API (401)', true);

        // Regenerate QR invalidates old attendance token
        const regenRes = await apiReq(baseUrl, `/api/classes/${cls.id}/attendance-qr/regenerate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminJwt}` }
        });
        assert.strictEqual(regenRes.status, 200);
        const token2 = regenRes.body.data.qr_url.split('/presensi-kelas/')[1];
        assert.notStrictEqual(token2, token1);
        const ctxAfterRegen = await apiReq(baseUrl, '/api/public/lesson-attendance/context', {
            headers: { Authorization: `Bearer ${attToken}` }
        });
        assert.strictEqual(ctxAfterRegen.status, 401);
        record('Regenerating QR immediately invalidates prior attendance token', true);

        // 6. Rate limiting on failed PIN attempts
        let rateLimited = false;
        for (let i = 0; i < 7; i++) {
            const failRes = await apiReq(baseUrl, `/api/public/lesson-attendance/classes/${token2}/verify-pin`, {
                method: 'POST',
                body: { teacher_id: teacher.id, pin: '999998' }
            });
            if (failRes.status === 429) {
                rateLimited = true;
                break;
            }
        }
        assert.strictEqual(rateLimited, true, 'Rate limit should trigger 429');
        record('PIN brute-force rate limiting triggers HTTP 429', true);

        // 7. Audit trail sanitization check
        const logs = await db.LessonAttendanceLog.findAll({
            where: { id: { [db.Sequelize.Op.gt]: createdLogIdsBefore } }
        });
        assert(logs.length > 0, 'Audit logs created');
        for (const l of logs) {
            const raw = JSON.stringify(l.toJSON());
            assert.strictEqual(raw.includes(leadingZeroPin), false, 'Plaintext PIN must never appear in audit logs');
            assert.strictEqual(raw.includes(token1), false, 'QR token1 must never appear in audit logs');
            assert.strictEqual(raw.includes(token2), false, 'QR token2 must never appear in audit logs');
        }
        record('Audit trail recorded without plaintext PIN or QR tokens', true);

        // 8. Transaction foundation test (if class has roster & active period & subject)
        const activeYear = await lessonAttendanceService.getActiveAcademicYear();
        const roster = await lessonAttendanceService.getStudentRosterForClass(cls.id, activeYear.id);
        const subjects = await lessonAttendanceService.getSubjectsLookup();
        const periodData = await lessonAttendanceService.getAvailableLessonPeriods('23:59:59');
        if (roster.length > 0 && subjects.length > 0 && periodData.periods.length > 0) {
            const p = periodData.periods[0];
            const sessions = await lessonAttendanceService.submitAttendanceSessions({
                teacherId: teacher.id,
                classId: cls.id,
                academicYearId: activeYear.id,
                subjectId: subjects[0].id,
                lessonPeriodIds: [p.id],
                details: roster.map((s) => ({ student_id: s.student_id, status: 'HADIR' })),
                allowFuture: true
            });
            assert.strictEqual(sessions.length, 1);

            let dupCaught = false;
            try {
                await lessonAttendanceService.submitAttendanceSessions({
                    teacherId: teacher.id,
                    classId: cls.id,
                    academicYearId: activeYear.id,
                    subjectId: subjects[0].id,
                    lessonPeriodIds: [p.id],
                    details: roster.map((s) => ({ student_id: s.student_id, status: 'HADIR' })),
                    allowFuture: true
                });
            } catch (e) {
                if (e.statusCode === 409) dupCaught = true;
            }
            assert.strictEqual(dupCaught, true, 'Duplicate attendance session should throw 409');
            record('Transaction foundation creates session+details and rejects duplicate (409)', true);
        } else {
            console.log('SKIP | Transaction foundation (no roster/subject/period on first class)');
        }

        console.log('\nALL VERIFICATION TESTS PASSED!');
    } finally {
        // Restore original DB state cleanly
        await db.LessonAttendanceLog.destroy({
            where: { id: { [db.Sequelize.Op.gt]: createdLogIdsBefore } }
        });
        await db.LessonAttendanceDetail.destroy({
            where: { session_id: { [db.Sequelize.Op.gt]: createdSessionIdsBefore } }
        });
        await db.LessonAttendanceSession.destroy({
            where: { id: { [db.Sequelize.Op.gt]: createdSessionIdsBefore } }
        });
        await db.Teacher.scope('withPinHash').update(
            { attendance_pin_hash: origPinHash },
            { where: { id: teacher.id } }
        );
        await db.Class.scope('withAttendanceToken').update(
            { attendance_token: origQrToken, attendance_qr_active: origQrActive },
            { where: { id: cls.id } }
        );
        server.close();
        await db.sequelize.close();
    }
}

run().catch((err) => {
    console.error('TEST SUITE FAILED:', err);
    process.exit(1);
});
