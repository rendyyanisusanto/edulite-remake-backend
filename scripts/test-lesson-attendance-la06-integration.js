/* LA-06 read-only integration smoke test against the configured database.
 * Usage: node scripts/test-lesson-attendance-la06-integration.js [classId] [YYYY-MM-DD] [outDir]
 * Performs SELECT queries only; writes export files to outDir (default: ./tmp-la06). */
const fs = require('fs');
const path = require('path');
const db = require('../src/models');
const report = require('../src/modules/lesson-attendance/lesson-attendance-integrated-report.service');
const exporter = require('../src/modules/lesson-attendance/lesson-attendance-integrated-export.service');

(async () => {
  const out = path.resolve(process.argv[4] || 'tmp-la06');
  fs.mkdirSync(out, { recursive: true });
  const [admin] = await db.sequelize.query(
    "SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE r.name = 'SUPERADMIN' LIMIT 1",
    { type: db.Sequelize.QueryTypes.SELECT }
  ).catch(() => []);
  const userId = admin?.id;
  let classId = Number(process.argv[2]);
  if (!classId) {
    const [c] = await db.sequelize.query(
      'SELECT c.id FROM classes c JOIN student_class_history h ON h.class_id = c.id GROUP BY c.id ORDER BY COUNT(*) DESC LIMIT 1',
      { type: db.Sequelize.QueryTypes.SELECT });
    classId = c.id;
  }
  const q = { class_id: classId, ...(process.argv[3] ? { attendance_date: process.argv[3] } : {}) };
  const started = Date.now();
  const data = await report.buildReport(q, { userId, requestId: 'smoke' });
  console.log('report ms:', Date.now() - started);
  console.log(JSON.stringify({
    date: data.report_date, class: data.class, provisional: data.is_provisional, historical: data.is_historical_mode,
    periods: data.periods.map((p) => `${p.label} ${p.start_time}-${p.end_time}`), summary: data.summary,
    completeness: data.completeness, findings_rows: data.findings_table.length,
    warnings: data.warnings.map((w) => `[${w.level}] ${w.message}`), source_errors: data.source_errors
  }, null, 2));
  console.log('sample student:', JSON.stringify(data.students[0]?.gate), data.students[0]?.tahfidz?.display_status,
    data.students[0]?.lessons.map((l) => l.display_status).join(' '));
  const x = await exporter.generateExcel(q, { userId, requestId: 'smoke' });
  fs.writeFileSync(path.join(out, x.filename), x.buffer);
  console.log('excel', x.filename, x.buffer.length);
  const p = await exporter.generatePdf(q, { userId, requestId: 'smoke' });
  fs.writeFileSync(path.join(out, p.filename), p.buffer);
  console.log('pdf', p.filename, p.buffer.length, p.buffer.slice(0, 5).toString());
  await db.sequelize.close();
  process.exit(0);
})().catch((e) => { console.error('SMOKE FAIL', e.errorCode || '', e.message, e.stack); process.exit(1); });
