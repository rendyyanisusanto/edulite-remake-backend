/* LA-06 detection-engine tests (pure; no database access). Run: node scripts/test-lesson-attendance-la06.js */
const assert = require('assert');
const analysis = require('../src/modules/lesson-attendance/lesson-attendance-integrated-analysis.service');
const exportSvc = require('../src/modules/lesson-attendance/lesson-attendance-integrated-export.service');

const CODE = { H: 'HADIR', T: 'TERLAMBAT', I: 'IZIN', S: 'SAKIT', A: 'ALPA', '-': 'NOT_RECORDED', '?': 'MISSING_DETAIL', X: 'CANCELLED', U: 'UPCOMING' };
const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

function student({ gate = 'in', thf = 'H', lessons = 'HHHH', clockIn = 405, clockOut = 960, shiftOutStart = 900, shiftOutEnd = 960, permissions = [], late = 0, coveredPeriods = [] }) {
  const cells = lessons.split('').map((ch, i) => {
    const start = 420 + i * 45;
    return {
      period_number: i + 1, status: CODE[ch], start_min: start, end_min: start + 45,
      period_start_time: hm(start), period_end_time: hm(start + 45),
      subject_name: `Mapel${i + 1}`, teacher_name: `Guru${i + 1}`, session_id: `s${i + 1}`,
      permission_covered: coveredPeriods.includes(i + 1), permission_label: coveredPeriods.includes(i + 1) ? 'Surat izin lomba' : null
    };
  });
  const g = { record: gate !== 'none', source_error: false, clock_in: null, clock_out: null, clock_in_min: null, clock_out_min: null,
    entry_status: null, exit_status: null, attendance_status: null, late_minutes: late, display_status: null, class_mismatch: false, record_id: 1,
    shift: { name: 'Reguler', clock_out_start_min: shiftOutStart, clock_out_end_min: shiftOutEnd, allow_checkout: true, config_reliable: true } };
  if (gate === 'in') { g.clock_in = hm(clockIn); g.clock_in_min = clockIn; g.display_status = late ? 'T' : 'H'; g.attendance_status = late ? 'LATE' : 'PRESENT'; g.entry_status = late ? 'LATE' : 'ONTIME'; }
  if (gate === 'sick') { g.display_status = 'S'; g.attendance_status = 'SICK'; }
  if (gate === 'permission') { g.display_status = 'I'; g.attendance_status = 'PERMISSION'; }
  if (clockOut !== null) { g.clock_out = hm(clockOut); g.clock_out_min = clockOut; }
  const map = { present: 'H', absent: 'A', sick: 'S', permission: 'I' };
  void map;
  const t = thf === '-' ? { record: false, status: null, display_status: '-' }
    : { record: true, status: { H: 'present', A: 'absent', S: 'sick', I: 'permission' }[thf], display_status: thf, record_id: 9 };
  return { student_id: 1, nis: '001', student_name: 'Siswa', gate: g, tahfidz: t, lessons: cells, permissions, other_class_lessons: 0 };
}

const baseCtx = (extra = {}) => ({
  isToday: false, currentMin: 1000, periods: Array.from({ length: 4 }, (_, i) => i), sources: { gate: true, tahfidz: true, lesson: true },
  tahfidzHasAnyRecord: true, tahfidzApplicable: true, classWideEmpty: false, ...extra
});

const results = [];
function check(name, expected, actual, ok) {
  results.push({ name, expected, actual, status: ok ? 'PASS' : 'FAIL' });
}
const run = (st, ctx = baseCtx()) => analysis.analyzeStudent(st, ctx).findings;
const codes = (f) => f.map((x) => x.finding_code);
const has = (f, c) => codes(f).includes(c);

(function tests() {
  let f;
  f = run(student({ lessons: 'HHHH' }));
  check('Masuk/H/HHHH → tidak ada temuan', 'none', codes(f).join(',') || 'none', f.length === 0);

  f = run(student({ thf: '-', lessons: 'HHHH' }));
  check('Tahfidz tidak tercatat, mapel hadir', 'LESSON_PRESENT_TAHFIDZ_NOT_RECORDED (INCONSISTENCY)', codes(f).join(','), has(f, 'LESSON_PRESENT_TAHFIDZ_NOT_RECORDED') && f[0].category === 'INCONSISTENCY' && /J1–J4/.test(f[0].description));

  f = run(student({ thf: '-', lessons: 'HHHH' }), baseCtx({ tahfidzHasAnyRecord: false }));
  check('Tahfidz kelas belum diinput → tidak ada temuan individual', 'none', codes(f).join(',') || 'none', f.length === 0);

  f = run(student({ thf: 'A', lessons: 'HHHH' }));
  check('ALPA Tahfidz, hadir mapel', 'TAHFIDZ_ABSENT_LESSON_PRESENT potensi', codes(f).join(','), has(f, 'TAHFIDZ_ABSENT_LESSON_PRESENT') && f[0].category === 'POTENTIAL_VIOLATION' && !has(f, 'GATE_PRESENT_TAHFIDZ_ABSENT'));

  f = run(student({ thf: 'A', lessons: 'HHHH' }), baseCtx({ tahfidzApplicable: false }));
  check('ALPA Tahfidz tanpa bukti kegiatan → ketidaksesuaian', 'INCONSISTENCY', f[0]?.category, f[0]?.category === 'INCONSISTENCY');

  f = run(student({ thf: 'A', lessons: '----' }));
  check('Masuk gerbang + ALPA Tahfidz (tanpa mapel)', 'GATE_PRESENT_TAHFIDZ_ABSENT', codes(f).join(','), has(f, 'GATE_PRESENT_TAHFIDZ_ABSENT'));

  f = run(student({ gate: 'none', lessons: 'HHHH' }));
  check('Gerbang tidak tercatat, hadir Tahfidz+mapel (digabung 1 temuan)', '1 LESSON_PRESENT_GATE_NOT_RECORDED', codes(f).join(','), f.length === 1 && has(f, 'LESSON_PRESENT_GATE_NOT_RECORDED') && /hadir Tahfidz dan J1–J4/.test(f[0].description));

  f = run(student({ gate: 'none', lessons: '----' }));
  check('Gerbang tidak tercatat, hanya hadir Tahfidz', 'TAHFIDZ_PRESENT_GATE_NOT_RECORDED', codes(f).join(','), has(f, 'TAHFIDZ_PRESENT_GATE_NOT_RECORDED'));

  f = run(student({ lessons: 'HHAAHH'.slice(0, 5) }));
  const t1 = f.find((x) => x.finding_code === 'POTENTIAL_LESSON_TRUANCY');
  check('H H A A H → indikasi bolos J3–J4, kembali J5', 'J3–J4 + J5', t1?.description, t1 && /J3–J4/.test(t1.description) && /J5/.test(t1.description) && t1.affected_periods.join() === '3,4');

  f = run(student({ lessons: 'HHAAA' }));
  const t2 = f.find((x) => x.finding_code === 'ABSENT_AFTER_LAST_PRESENCE');
  check('H H A A A → ALPA J3–J5 setelah hadir', 'ABSENT_AFTER_LAST_PRESENCE', t2?.description, t2 && /Terakhir tercatat hadir pada J2/.test(t2.description) && /J3–J5/.test(t2.description));

  f = run(student({ lessons: 'AAHH' }));
  const t3 = f.find((x) => x.finding_code === 'ABSENT_AT_START');
  check('A A H H → alpa jam awal', 'ABSENT_AT_START J1–J2', t3?.description, t3 && /J1–J2/.test(t3.description) && /pukul 06:45/.test(t3.description) && !has(f, 'POTENTIAL_LESSON_TRUANCY'));

  f = run(student({ lessons: 'AAAA' }));
  check('A A A A + masuk → seluruh jam tercatat alpa', 'GATE_PRESENT_ALL_LESSONS_ABSENT', codes(f).join(','), has(f, 'GATE_PRESENT_ALL_LESSONS_ABSENT') && !has(f, 'ABSENT_AT_START'));

  f = run(student({ lessons: 'HAHA' }));
  const eps = f.filter((x) => ['POTENTIAL_LESSON_TRUANCY', 'ABSENT_AFTER_LAST_PRESENCE'].includes(x.finding_code));
  check('H A H A → bolos J2 dan J4 (2 episode)', 'J2 ; J4', eps.map((e) => e.title).join(' ; '), eps.length === 2 && eps[0].affected_periods[0] === 2 && eps[1].affected_periods[0] === 4);

  f = run(student({ lessons: 'H--H' }));
  check('H - - H → bukan bolos', 'none', codes(f).join(',') || 'none', f.length === 0);

  f = run(student({ lessons: 'HA-AH'.slice(0, 5) }));
  const eps2 = f.filter((x) => /truancy|ABSENT_AFTER/i.test(x.finding_code));
  check('H A - A H → episode terpisah J2 & J4', '2 episodes', String(eps2.length), eps2.length === 2 && /J3 belum tercatat/.test(eps2[0].description));

  f = run(student({ gate: 'sick', thf: 'S', lessons: 'SSSS' }));
  check('Sakit di semua sumber → tidak ada potensi pelanggaran', 'none', codes(f).join(',') || 'none', f.length === 0);

  f = run(student({ gate: 'permission', thf: 'I', lessons: 'IIII' }));
  check('Izin di semua sumber → tidak ada potensi pelanggaran', 'none', codes(f).join(',') || 'none', f.length === 0);

  f = run(student({ gate: 'none', thf: '-', lessons: '----' }));
  check('Tidak ada data sama sekali → data belum lengkap', 'ALL_ATTENDANCE_NOT_RECORDED INCOMPLETE', f[0]?.category, f.length === 1 && f[0].category === 'INCOMPLETE_DATA');

  f = run(student({ gate: 'none', thf: '-', lessons: '----' }), baseCtx({ classWideEmpty: true }));
  check('Satu kelas kosong → tidak ada temuan individual', 'none', codes(f).join(',') || 'none', f.length === 0);

  f = run(student({ clockOut: 500, lessons: 'HHAA' }));
  const ed = f.find((x) => x.finding_code === 'POTENTIAL_EARLY_DEPARTURE');
  check('Pulang 08:20 sebelum 15:00 + ALPA', 'POTENTIAL_EARLY_DEPARTURE + J3–J4', ed?.description, ed && /08:20/.test(ed.description) && /15:00/.test(ed.description) && /J3–J4/.test(ed.description) && !has(f, 'ABSENT_AFTER_LAST_PRESENCE'));

  f = run(student({ clockOut: 500, lessons: 'HHHH', permissions: [{ kind: 'LETTER', label: 'Surat izin', whole_day: false, start_min: 480, end_min: 540 }] }));
  check('Approved early departure → tidak ada temuan pulang awal', 'no early departure', codes(f).join(',') || 'none', !has(f, 'POTENTIAL_EARLY_DEPARTURE'));

  f = run(student({ clockOut: 735, lessons: 'HHHH' }), baseCtx({}));
  check('Shift historis tidak tersedia → tanpa kesimpulan', 'none', 'n/a', (() => {
    const st = student({ clockOut: 735, lessons: 'HHHH' }); st.gate.shift.config_reliable = false;
    return !has(run(st), 'POTENTIAL_EARLY_DEPARTURE');
  })());

  f = run(student({ clockOut: null, lessons: 'HHHH' }), baseCtx({ isToday: true, currentMin: 900 }));
  check('Jam pulang belum tiba → tidak ada temuan checkout', 'none', codes(f).join(',') || 'none', !has(f, 'GATE_CHECKOUT_NOT_RECORDED'));

  f = run(student({ clockOut: null, lessons: 'HHHH' }), baseCtx({ isToday: true, currentMin: 1000 }));
  check('Checkout window berakhir → GATE_CHECKOUT_NOT_RECORDED', 'present', codes(f).join(','), has(f, 'GATE_CHECKOUT_NOT_RECORDED'));

  (() => { const st = student({ clockOut: null, lessons: 'HHHH' }); st.gate.shift.allow_checkout = false; check('Checkout tidak diwajibkan', 'none', 'n/a', !has(run(st, baseCtx({ isToday: true, currentMin: 1000 })), 'GATE_CHECKOUT_NOT_RECORDED')); })();

  f = run(student({ clockIn: 435, late: 15, lessons: 'HHHH' }));
  check('Terlambat masuk 15 menit (late_minutes existing)', 'GATE_LATE_ENTRY', f[0]?.description, has(f, 'GATE_LATE_ENTRY') && /terlambat 15 menit/.test(f[0].description) && /07:15/.test(f[0].description));

  f = run(student({ lessons: 'HAHH', coveredPeriods: [2] }));
  check('Approved leave pada jam ALPA → bukan bolos, jadi ketidaksesuaian', 'APPROVED_PERMISSION_ABSENT_CONFLICT', codes(f).join(','), has(f, 'APPROVED_PERMISSION_ABSENT_CONFLICT') && !has(f, 'POTENTIAL_LESSON_TRUANCY'));

  f = run(student({ gate: 'sick', thf: 'S', lessons: 'HHSS' }));
  check('Gerbang sakit tetapi hadir mapel → konflik', 'CROSS_ATTENDANCE_STATUS_CONFLICT', codes(f).join(','), has(f, 'CROSS_ATTENDANCE_STATUS_CONFLICT'));

  f = run(student({ clockOut: 735, lessons: 'HHHH' }));
  check('Hadir J4 (08:45 mulai 09:45) setelah pulang 12:15?', 'tidak konflik bila periode sebelum pulang', 'n/a', !f.some((x) => /setelah jam pulang/.test(x.title)));

  (() => { const st = student({ clockOut: 500, lessons: 'HHHH' }); const ff = run(st); check('Hadir mapel setelah jam pulang → konflik', 'conflict', codes(ff).join(','), ff.some((x) => /setelah jam pulang/.test(x.title))); })();

  (() => { const st = student({ clockOut: 380, lessons: 'HHHH' }); check('Jam pulang sebelum jam masuk', 'conflict', 'n/a', run(st).some((x) => x.title === 'Jam pulang sebelum jam masuk')); })();

  (() => { const st = student({ lessons: 'HAHA' }); st.gate.source_error = true; st.tahfidz.source_error = true; const ff = run(st, baseCtx({ sources: { gate: false, tahfidz: false, lesson: true } })); check('Gagal muat gerbang/Tahfidz → tidak ada temuan gerbang/Tahfidz', 'only lesson findings', codes(ff).join(','), !ff.some((x) => /GATE|TAHFIDZ/.test(x.finding_code))); })();

  (() => { const st = student({ lessons: 'HAHA' }); const ff = run(st, baseCtx({ sources: { gate: true, tahfidz: true, lesson: false } })); check('Gagal muat jam pelajaran → tidak ada temuan bolos', 'none lesson', codes(ff).join(',') || 'none', !ff.some((x) => /TRUANCY|ABSENT_AFTER|ABSENT_AT/.test(x.finding_code))); })();

  (() => { const st = student({ thf: 'A', gate: 'none', lessons: 'HAHH', clockOut: 735 }); const ff = run(st); const uniq = new Set(ff.map((x) => `${x.finding_code}|${x.title}`)); check('Multiple findings tanpa duplikat', 'unique', String(ff.length), ff.length >= 3 && uniq.size === ff.length); })();

  // Excel sanitizer
  check('Formula injection disanitasi', "'=SUM(A1)", exportSvc.sanitizeExcelText('=SUM(A1)'), exportSvc.sanitizeExcelText('=SUM(A1)') === "'=SUM(A1)");
  check('Filename aman', 'Laporan-Harian-Terpadu-XI-TKJ-1-2026-11-26.pdf', exportSvc.buildFilename({ class: { name: 'XI TKJ 1/../x' }, report_date: '2026-11-26' }, 'pdf'), /^Laporan-Harian-Terpadu-XI-TKJ-1x-2026-11-26\.pdf$/.test(exportSvc.buildFilename({ class: { name: 'XI TKJ 1/../x' }, report_date: '2026-11-26' }, 'pdf')));
}());

console.table(results.map((r) => ({ Test: r.name, Status: r.status })));
results.filter((r) => r.status === 'FAIL').forEach((r) => console.log('FAIL:', r.name, '| expected:', r.expected, '| actual:', r.actual));
const failed = results.filter((r) => r.status === 'FAIL').length;
console.log(`${results.length - failed}/${results.length} passed`);
assert.strictEqual(failed, 0);
process.exit(0);

