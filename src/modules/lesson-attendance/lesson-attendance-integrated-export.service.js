'use strict';

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const db = require('../../models');
const { SchoolProfile, DocumentSetting } = db;
const reportService = require('./lesson-attendance-integrated-report.service');
const { ERROR_CODES, AppError } = require('./lesson-attendance.constants');
const logger = require('../../core/logger');

const { DISCLAIMER } = reportService;

const STATUS_STYLE = {
    H: { fg: 'FFD1FAE5', font: 'FF065F46', bg: '#dcfce7', color: '#166534' },
    T: { fg: 'FFFEF3C7', font: 'FF92400E', bg: '#fef3c7', color: '#92400e' },
    I: { fg: 'FFDBEAFE', font: 'FF1E40AF', bg: '#dbeafe', color: '#1e40af' },
    S: { fg: 'FFEDE9FE', font: 'FF5B21B6', bg: '#ede9fe', color: '#5b21b6' },
    A: { fg: 'FFFEE2E2', font: 'FF991B1B', bg: '#fee2e2', color: '#991b1b' },
    '-': { fg: 'FFF3F4F6', font: 'FF6B7280', bg: '#f3f4f6', color: '#6b7280' },
    '?': { fg: 'FFFEF3C7', font: 'FFB45309', bg: '#fffbeb', color: '#b45309' },
    X: { fg: 'FFF3F4F6', font: 'FF92400E', bg: '#f3f4f6', color: '#92400e' },
    '◷': { fg: 'FFF9FAFB', font: 'FF9CA3AF', bg: '#f9fafb', color: '#9ca3af' }
};

const LEGEND = 'H=Hadir, T=Terlambat, I=Izin, S=Sakit, A=Alpa, -=Tidak tercatat, ?=Data tidak lengkap/konflik, X=Dibatalkan, ◷=Belum berlangsung';

function sanitizeExcelText(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
}

function escapeHtml(val) {
    return String(val ?? '').replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

function formatDateId(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00Z`);
    return Number.isNaN(d.getTime())
        ? String(dateStr)
        : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function formatGenerated(iso, tz) {
    return new Date(iso).toLocaleString('id-ID', { timeZone: tz || 'Asia/Jakarta' });
}

function sanitizeFilename(name) {
    return String(name || '').trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
}

function buildFilename(report, ext) {
    return `Laporan-Harian-Terpadu-${sanitizeFilename(report.class.name) || 'Kelas'}-${report.report_date}.${ext}`;
}

function gateInText(st) {
    if (st.gate.source_error) return '?';
    if (st.gate.clock_in) return `${st.gate.clock_in}${st.gate.display_status === 'T' ? ' (T)' : ''}`;
    if (['I', 'S', 'A'].includes(st.gate.display_status)) return st.gate.display_status;
    return '-';
}
function gateOutText(st) {
    if (st.gate.source_error) return '?';
    return st.gate.clock_out || '-';
}

function loadLocalLogoDataUri(logoPath) {
    if (!logoPath || typeof logoPath !== 'string') return null;
    if (logoPath.startsWith('data:')) return logoPath;
    if (/^https?:/.test(logoPath)) return null;
    const rel = logoPath.replace(/^\/+/, '');
    const candidates = [
        path.resolve(__dirname, '../../../public', rel),
        path.resolve(__dirname, '../../../public/uploads', rel)
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            const ext = path.extname(candidate).toLowerCase().replace('.', '') || 'png';
            return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${fs.readFileSync(candidate).toString('base64')}`;
        }
    }
    return null;
}

const THIN = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

function styleStatusCell(cell, code) {
    const s = STATUS_STYLE[code];
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (s) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: s.fg } };
        cell.font = { bold: code === 'A', size: 9, color: { argb: s.font } };
    }
}

function periodsText(f) {
    return f.affected_periods && f.affected_periods.length ? f.affected_periods.map((p) => `J${p}`).join(', ') : '-';
}

function parseBoolFlag(val, defaultVal = true) {
    if (val === undefined || val === null || val === '') return defaultVal;
    const s = String(val).trim().toLowerCase();
    return !['false', '0', 'no', 'off'].includes(s);
}

function parseClassIds(query = {}) {
    const raw = query.class_ids !== undefined && query.class_ids !== '' ? query.class_ids : query.class_id;
    const arr = Array.isArray(raw) ? raw : String(raw || '').split(',');
    const ids = [...new Set(arr.map((v) => Number(String(v).trim())).filter((n) => Number.isInteger(n) && n > 0))];
    if (ids.length === 0) {
        throw new AppError('Pilih minimal satu kelas untuk dicetak.', 422, ERROR_CODES.INVALID_CLASS);
    }
    if (ids.length > 50) {
        throw new AppError('Maksimal 50 kelas dalam satu kali cetak PDF.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    return ids;
}

class IntegratedDailyReportExportService {
    async _load(query, actor) {
        // Exports always cover the entire class: view-only filters are ignored.
        const {
            search, finding_category, finding_code, class_ids,
            include_kop, include_matrix, include_summary, include_findings, include_notes,
            ...base
        } = query || {};
        void search; void finding_category; void finding_code; void class_ids;
        void include_kop; void include_matrix; void include_summary; void include_findings; void include_notes;
        return reportService.buildReport(base, {
            userId: actor.userId, requestId: actor.requestId, applyViewFilters: false
        });
    }

    async _loadMany(query, actor) {
        const classIds = parseClassIds(query);
        const {
            search, finding_category, finding_code, class_ids,
            include_kop, include_matrix, include_summary, include_findings, include_notes,
            ...base
        } = query || {};
        void search; void finding_category; void finding_code; void class_ids;
        void include_kop; void include_matrix; void include_summary; void include_findings; void include_notes;

        const reports = [];
        for (const cid of classIds) {
            reports.push(await reportService.buildReport(
                { ...base, class_id: cid },
                { userId: actor.userId, requestId: actor.requestId, applyViewFilters: false }
            ));
        }
        // Deterministic grouping order: grade level -> class name -> class id (never random)
        reports.sort((a, b) =>
            (Number(a.class.grade_level ?? 999) - Number(b.class.grade_level ?? 999)) ||
            String(a.class.name || '').localeCompare(String(b.class.name || ''), 'id') ||
            (Number(a.class.id) - Number(b.class.id))
        );
        return reports;
    }

    _logExport(report, format, actor) {
        logger.info('Integrated daily attendance report exported', {
            module: 'lesson-attendance',
            feature: 'integrated-daily-report',
            report_type: 'integrated-daily',
            operation: `export_${format}`,
            user_id: actor.userId || null,
            request_id: actor.requestId || null,
            report_date: report.report_date,
            academic_year_id: report.academic_year.id,
            class_id: report.class.id,
            export_format: format,
            total_students: report.summary.total_students,
            students_with_findings: report.summary.students_needing_verification,
            timestamp: new Date().toISOString()
        });
    }

    // ----------------------------------------------------------------------------- Excel
    async generateExcel(query = {}, actor = {}) {
        const report = await this._load(query, actor);
        try {
            const schoolProfile = await SchoolProfile.findOne({ attributes: ['name', 'address', 'city'] });
            const periods = report.periods;
            const wb = new ExcelJS.Workbook();
            wb.creator = 'Edulite';
            wb.created = new Date();
            const generated = formatGenerated(report.generated_at, report.timezone);

            // ---------------- Sheet 1
            const ws = wb.addWorksheet('Presensi Harian');
            const fixed = 3; // No, NIS, Nama
            const gateStart = fixed + 1; // Masuk, Pulang
            const thfCol = gateStart + 2;
            const lessonStart = thfCol + 1;
            const recapStart = lessonStart + periods.length;
            const findingCol = recapStart + 5;
            const totalCols = findingCol;
            const lastLetter = ws.getColumn(totalCols).letter;

            const topLines = [
                [sanitizeExcelText(schoolProfile?.name || 'SEKOLAH'), { bold: true, size: 14 }],
                [`${sanitizeExcelText(schoolProfile?.address || '')}${schoolProfile?.city ? ` - ${sanitizeExcelText(schoolProfile.city)}` : ''}`, { size: 9 }],
                ['LAPORAN HARIAN TERPADU SISWA', { bold: true, size: 12 }],
                [`Tanggal: ${formatDateId(report.report_date)} | Tahun Ajaran: ${sanitizeExcelText(report.academic_year.name)} | Kelas: ${sanitizeExcelText(report.class.name)}`, { size: 10 }],
                [`Wali Kelas: ${sanitizeExcelText(report.class.homeroom_teacher_name || '-')}${report.class.homeroom_is_current && report.is_historical_mode ? ' (wali kelas saat ini)' : ''} | Jumlah Siswa: ${report.class.student_count} | Dicetak: ${generated}${report.is_provisional ? ' | LAPORAN SEMENTARA — kegiatan sekolah masih berlangsung' : ''}`, { size: 9 }],
                [`Keterangan: ${LEGEND}`, { size: 8, italic: true }]
            ];
            topLines.forEach(([text, font], i) => {
                ws.mergeCells(`A${i + 1}:${lastLetter}${i + 1}`);
                const c = ws.getCell(`A${i + 1}`);
                c.value = text;
                c.font = font;
            });

            const h1 = 8;
            const h2 = 9;
            const setHead = (row, col, value) => {
                const c = ws.getRow(row).getCell(col);
                c.value = value;
                c.font = { bold: true, size: 9 };
                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
                c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                c.border = THIN;
            };
            const group = (label, from, to) => {
                for (let c = from; c <= to; c += 1) setHead(h1, c, c === from ? label : null);
                if (to > from) ws.mergeCells(h1, from, h1, to);
            };
            group('Identitas Siswa', 1, 3);
            group('Presensi Gerbang', gateStart, gateStart + 1);
            group('Tahfidz', thfCol, thfCol);
            if (periods.length) group('Presensi Jam Pelajaran', lessonStart, recapStart - 1);
            group('Rekap Mapel', recapStart, recapStart + 4);
            group('Temuan', findingCol, findingCol);
            ['No', 'NIS', 'Nama Siswa', 'Masuk', 'Pulang', 'Status'].forEach((t, i) => setHead(h2, i + 1, t));
            periods.forEach((p, i) => setHead(h2, lessonStart + i, `${p.label}\n${p.start_time || ''}`));
            ['H', 'T', 'I', 'S', 'A'].forEach((t, i) => setHead(h2, recapStart + i, t));
            setHead(h2, findingCol, 'Jumlah Temuan');
            ws.getRow(h2).height = 28;

            ws.getColumn(1).width = 5;
            ws.getColumn(2).width = 14;
            ws.getColumn(3).width = 30;
            ws.getColumn(gateStart).width = 11;
            ws.getColumn(gateStart + 1).width = 9;
            ws.getColumn(thfCol).width = 8;
            periods.forEach((_, i) => { ws.getColumn(lessonStart + i).width = 6; });
            for (let i = 0; i < 5; i += 1) ws.getColumn(recapStart + i).width = 5;
            ws.getColumn(findingCol).width = 12;

            report.students.forEach((st, idx) => {
                const row = ws.getRow(h2 + 1 + idx);
                row.getCell(1).value = idx + 1;
                row.getCell(2).value = sanitizeExcelText(st.nis || '-');
                row.getCell(2).numFmt = '@';
                row.getCell(3).value = sanitizeExcelText(st.student_name);
                row.getCell(gateStart).value = gateInText(st);
                row.getCell(gateStart + 1).value = gateOutText(st);
                const entryCode = st.gate.source_error ? '?' : (['I', 'S', 'A'].includes(st.gate.display_status) && !st.gate.clock_in ? st.gate.display_status : (st.gate.display_status === 'T' ? 'T' : (st.gate.clock_in ? 'H' : '-')));
                styleStatusCell(row.getCell(gateStart), entryCode);
                row.getCell(gateStart + 1).alignment = { horizontal: 'center' };
                row.getCell(thfCol).value = st.tahfidz.display_status;
                styleStatusCell(row.getCell(thfCol), st.tahfidz.display_status);
                st.lessons.forEach((c, i) => {
                    const cell = row.getCell(lessonStart + i);
                    cell.value = c.display_status;
                    styleStatusCell(cell, c.display_status);
                });
                [st.lesson_summary.hadir, st.lesson_summary.terlambat, st.lesson_summary.izin, st.lesson_summary.sakit, st.lesson_summary.alpa]
                    .forEach((v, i) => {
                        const cell = row.getCell(recapStart + i);
                        cell.value = Number(v);
                        cell.alignment = { horizontal: 'right' };
                    });
                row.getCell(findingCol).value = Number(st.finding_count);
                row.getCell(findingCol).alignment = { horizontal: 'right' };
                for (let c = 1; c <= totalCols; c += 1) row.getCell(c).border = THIN;
            });
            ws.views = [{ state: 'frozen', xSplit: 3, ySplit: h2 }];
            ws.autoFilter = { from: { row: h2, column: 1 }, to: { row: h2, column: totalCols } };

            // ---------------- Sheet 2
            const ws2 = wb.addWorksheet('Potensi Pelanggaran', { views: [{ state: 'frozen', ySplit: 5 }] });
            ws2.mergeCells('A1:I1');
            ws2.getCell('A1').value = `Daftar Potensi Pelanggaran dan Ketidaksesuaian Presensi — ${sanitizeExcelText(report.class.name)} — ${formatDateId(report.report_date)}`;
            ws2.getCell('A1').font = { bold: true, size: 12 };
            ws2.mergeCells('A2:I3');
            ws2.getCell('A2').value = DISCLAIMER;
            ws2.getCell('A2').alignment = { wrapText: true, vertical: 'top' };
            ws2.getCell('A2').font = { italic: true, size: 9 };
            const h2s = ['No', 'NIS', 'Nama Siswa', 'Kategori Temuan', 'Jenis Temuan', 'Jam Terkait', 'Mata Pelajaran', 'Bukti', 'Keterangan'];
            h2s.forEach((t, i) => {
                const c = ws2.getRow(5).getCell(i + 1);
                c.value = t;
                c.font = { bold: true, size: 10 };
                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
                c.border = THIN;
            });
            [5, 14, 28, 22, 32, 14, 34, 60, 50].forEach((w, i) => { ws2.getColumn(i + 1).width = w; });
            let n = 0;
            const catLabel = { POTENTIAL_VIOLATION: 'Potensi Pelanggaran', INCONSISTENCY: 'Ketidaksesuaian Presensi' };
            for (const st of report.students) {
                for (const f of st.findings.filter((x) => x.category !== 'INCOMPLETE_DATA')) {
                    n += 1;
                    const subjects = f.evidence.filter((e) => e.startsWith('Mata pelajaran:')).map((e) => e.replace('Mata pelajaran: ', '')).join(' ');
                    const r = ws2.addRow([
                        n, sanitizeExcelText(st.nis || '-'), sanitizeExcelText(st.student_name),
                        catLabel[f.category] || f.category, sanitizeExcelText(f.title), periodsText(f),
                        sanitizeExcelText(subjects || '-'), sanitizeExcelText(f.evidence.join('\n')), sanitizeExcelText(f.description)
                    ]);
                    r.getCell(2).numFmt = '@';
                    for (let c = 1; c <= 9; c += 1) {
                        r.getCell(c).border = THIN;
                        r.getCell(c).alignment = { vertical: 'top', wrapText: true };
                    }
                }
            }
            if (n === 0) {
                ws2.addRow(['', '', 'Tidak ditemukan potensi pelanggaran atau ketidaksesuaian berdasarkan data presensi yang tersedia.']);
            }
            ws2.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 9 } };

            // ---------------- Sheet 3
            const ws3 = wb.addWorksheet('Ringkasan');
            ws3.getColumn(1).width = 46;
            ws3.getColumn(2).width = 22;
            ws3.getColumn(3).width = 60;
            const s = report.summary;
            const c = report.completeness;
            const addRow = (label, value, note = '') => {
                const r = ws3.addRow([label, value, note]);
                if (typeof value === 'number') r.getCell(2).alignment = { horizontal: 'right' };
                return r;
            };
            const section = (t) => {
                const r = ws3.addRow([t]);
                r.getCell(1).font = { bold: true };
                r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
            };
            ws3.addRow([`Ringkasan Laporan Harian Terpadu — ${sanitizeExcelText(report.class.name)} — ${formatDateId(report.report_date)}`]).getCell(1).font = { bold: true, size: 12 };
            ws3.addRow([`Dihasilkan: ${generated}${report.is_provisional ? ' (LAPORAN SEMENTARA)' : ''}`]);
            ws3.addRow([]);
            section('Umum');
            addRow('Total siswa', s.total_students);
            section('Presensi Gerbang');
            addRow('Presensi masuk tercatat', s.gate_entry_recorded);
            addRow('Siswa terlambat masuk', s.gate_late_entry);
            addRow('Record pulang', c.gate_exit_records ?? 'Gagal dimuat');
            section('Tahfidz');
            addRow('Siswa hadir Tahfidz', s.tahfidz_present);
            addRow('Siswa ALPA Tahfidz', s.tahfidz_absent);
            addRow('Siswa memiliki record Tahfidz', c.tahfidz_records ?? 'Gagal dimuat');
            section('Jam Pelajaran');
            addRow('Siswa memiliki ALPA mapel', s.students_with_lesson_alpa);
            addRow('Siswa terindikasi bolos', s.students_potential_truancy);
            addRow('Jam tercatat', c.lesson_periods_recorded ?? 'Gagal dimuat', `dari ${c.lesson_periods_total} jam`);
            section('Temuan');
            addRow('Siswa memerlukan verifikasi (distinct)', s.students_needing_verification);
            addRow('Jumlah temuan', s.total_findings);
            section('Kelengkapan Data');
            addRow('Gerbang masuk', c.gate_entry_records ?? 'Gagal dimuat', `dari ${c.total_students} siswa memiliki record`);
            addRow('Gerbang pulang', c.gate_exit_records ?? 'Gagal dimuat', `dari ${c.total_students} siswa memiliki record`);
            addRow('Tahfidz', c.tahfidz_records ?? 'Gagal dimuat', `dari ${c.total_students} siswa memiliki record`);
            addRow('Jam pelajaran', c.lesson_periods_recorded ?? 'Gagal dimuat', `dari ${c.lesson_periods_total} jam telah tercatat`);
            section('Warning');
            if (!report.warnings.length) ws3.addRow(['Tidak ada warning.']);
            report.warnings.forEach((w) => {
                const r = ws3.addRow([`[${w.level.toUpperCase()}] ${sanitizeExcelText(w.message)}`]);
                ws3.mergeCells(`A${r.number}:C${r.number}`);
                r.getCell(1).alignment = { wrapText: true, vertical: 'top' };
            });
            section('Legenda Status');
            ws3.addRow([LEGEND]);
            section('Disclaimer');
            const dr = ws3.addRow([DISCLAIMER]);
            ws3.mergeCells(`A${dr.number}:C${dr.number}`);
            dr.getCell(1).alignment = { wrapText: true, vertical: 'top' };
            dr.height = 45;
            ws3.addRow(['Export mencakup seluruh siswa dalam kelas yang dipilih.']);

            const buffer = await wb.xlsx.writeBuffer();
            this._logExport(report, 'excel', actor);
            return { buffer: Buffer.from(buffer), filename: buildFilename(report, 'xlsx') };
        } catch (error) {
            return this._fail(error, 'exportExcel', report, actor);
        }
    }

    // ------------------------------------------------------------------------------ PDF
    _renderClassSectionHtml(report, { schoolProfile, logoDataUri, headerImageUri, opts }) {
        const periods = report.periods;
        const dense = periods.length > 14;
        const tdFont = dense ? 6.5 : 7.5;
        const chip = (code, extra = '') => {
            const st = STATUS_STYLE[code] || STATUS_STYLE['-'];
            return `<td class="c" style="background:${st.bg};color:${st.color};${code === 'A' ? 'font-weight:bold;' : ''}${extra}">${escapeHtml(code)}</td>`;
        };
        const entryCode = (st) => (st.gate.source_error ? '?' : (['I', 'S', 'A'].includes(st.gate.display_status) && !st.gate.clock_in ? st.gate.display_status : (st.gate.display_status === 'T' ? 'T' : (st.gate.clock_in ? 'H' : '-'))));

        const rows = report.students.length === 0
            ? `<tr><td colspan="${6 + periods.length + 5}" class="c">Tidak ada siswa pada kelas ini untuk tanggal yang dipilih.</td></tr>`
            : report.students.map((st, i) => {
                const gateStyle = STATUS_STYLE[entryCode(st)] || STATUS_STYLE['-'];
                return `<tr>
                <td class="c">${i + 1}</td>
                <td>${escapeHtml(st.nis || '-')}</td>
                <td class="name">${escapeHtml(st.student_name)}</td>
                <td class="c" style="background:${gateStyle.bg};color:${gateStyle.color};">${escapeHtml(gateInText(st))}</td>
                <td class="c">${escapeHtml(gateOutText(st))}</td>
                ${chip(st.tahfidz.display_status)}
                ${st.lessons.map((c) => chip(c.display_status)).join('')}
                <td class="r">${st.lesson_summary.hadir}</td><td class="r">${st.lesson_summary.terlambat}</td>
                <td class="r">${st.lesson_summary.izin}</td><td class="r">${st.lesson_summary.sakit}</td>
                <td class="r" style="${st.lesson_summary.alpa > 0 ? 'color:#991b1b;font-weight:bold;' : ''}">${st.lesson_summary.alpa}</td>
            </tr>`;
            }).join('');

        const s = report.summary;
        const summaryItems = [
            ['Total siswa', s.total_students],
            ['Presensi masuk tercatat', s.gate_entry_recorded],
            ['Siswa terlambat masuk', s.gate_late_entry],
            ['Siswa hadir Tahfidz', s.tahfidz_present],
            ['Siswa ALPA Tahfidz', s.tahfidz_absent],
            ['Siswa memiliki ALPA mapel', s.students_with_lesson_alpa],
            ['Siswa terindikasi bolos', s.students_potential_truancy],
            ['Siswa memerlukan verifikasi', s.students_needing_verification]
        ];

        const findingRows = report.findings_table.map((f, i) => {
            const all = [...f.potential, ...f.inconsistencies];
            const temuan = all.map((x) => `<li>${escapeHtml(x.description)}</li>`).join('');
            const bukti = all.map((x) => `<div class="ev"><strong>${escapeHtml(x.title)}</strong><ul>${x.evidence.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>`).join('');
            const pot = f.potential.length ? `<div class="tag p">Potensi pelanggaran: ${f.potential.length}</div>` : '';
            const inc = f.inconsistencies.length ? `<div class="tag i">Ketidaksesuaian: ${f.inconsistencies.length}</div>` : '';
            return `<tr><td class="c">${i + 1}</td><td>${escapeHtml(f.nis || '-')}</td><td class="name">${escapeHtml(f.student_name)}</td>
                <td>${pot}${inc}<ul>${temuan}</ul></td><td>${bukti}</td></tr>`;
        }).join('');

        const warningHtml = report.warnings.length
            ? `<ul>${report.warnings.map((w) => `<li class="w-${w.level}">${escapeHtml(w.message)}</li>`).join('')}</ul>`
            : '<p>Tidak ada catatan kelengkapan data.</p>';
        const c = report.completeness;
        const fmt = (v, total) => (v === null ? 'gagal dimuat' : `${v} dari ${total}`);
        const generated = formatGenerated(report.generated_at, report.timezone);
        const homeroom = report.class.homeroom_teacher_name || '-';

        const kopHtml = !opts.kop ? '' : (headerImageUri
            ? `<div class="kop-banner"><img class="kop-img" src="${headerImageUri}" alt="Kop Sekolah" /></div>`
            : `<div class="header">
  ${logoDataUri ? `<img class="logo" src="${logoDataUri}" alt="Logo" />` : ''}
  <div><p class="school">${escapeHtml(schoolProfile?.name || 'SEKOLAH')}</p>
  <p class="addr">${escapeHtml(schoolProfile?.address || '')}${schoolProfile?.city ? ` - ${escapeHtml(schoolProfile.city)}` : ''}</p></div>
</div>`);

        const matrixHtml = !opts.matrix ? '' : `
<h3>A. REKAPITULASI PRESENSI HARIAN</h3>
<table class="grid ${dense ? 'dense' : ''}"><thead>
  <tr><th rowspan="2">No</th><th rowspan="2">NIS</th><th rowspan="2">Nama Siswa</th><th colspan="2">Gerbang</th><th rowspan="2">Tahfidz</th>
      ${periods.length ? `<th colspan="${periods.length}">Jam Pelajaran</th>` : ''}<th colspan="5">Rekap Mapel</th></tr>
  <tr><th>Masuk</th><th>Pulang</th>${periods.map((p) => `<th>${escapeHtml(p.label)}</th>`).join('')}<th>H</th><th>T</th><th>I</th><th>S</th><th>A</th></tr>
</thead><tbody>${rows}</tbody></table>
<div class="legend"><b>Legenda:</b> ${escapeHtml(LEGEND)}. (T) pada jam masuk = terlambat.</div>`;

        const summaryHtml = !opts.summary ? '' : `
<section class="keep"><h3>B. RINGKASAN PRESENSI</h3>
<div class="sum">${summaryItems.map(([k, v]) => `<div>${escapeHtml(k)}<br/><b>${v}</b></div>`).join('')}</div></section>`;

        const needBreakBeforeFindings = opts.matrix || opts.summary;
        const findingsHtml = !opts.findings ? '' : `
<div class="${needBreakBeforeFindings ? 'findings' : ''}"><h3>C. DAFTAR POTENSI PELANGGARAN DAN KETIDAKSESUAIAN PRESENSI</h3>
${report.findings_table.length ? `<table class="grid"><thead><tr><th style="width:24px">No</th><th style="width:60px">NIS</th><th style="width:130px">Nama Siswa</th><th>Potensi Pelanggaran / Temuan</th><th>Bukti dan Keterangan</th></tr></thead><tbody>${findingRows}</tbody></table>`
            : '<p>Tidak ditemukan potensi pelanggaran atau ketidaksesuaian berdasarkan data presensi yang tersedia.</p>'}
</div>`;

        const notesHtml = !opts.notes ? '' : `
<section class="keep"><h3>D. CATATAN KELENGKAPAN DATA</h3>
<p>Gerbang masuk: ${fmt(c.gate_entry_records, c.total_students)} siswa memiliki record. Gerbang pulang: ${fmt(c.gate_exit_records, c.total_students)}. Tahfidz: ${fmt(c.tahfidz_records, c.total_students)}. Jam pelajaran: ${fmt(c.lesson_periods_recorded, c.lesson_periods_total)} jam telah tercatat.</p>
${warningHtml}</section>
<div class="disc">${escapeHtml(DISCLAIMER)}</div>
<div class="sign">Mengetahui,<br/>Wali Kelas<br/><br/><br/><br/>(${escapeHtml(homeroom)})${report.is_historical_mode ? '<br/><span style="font-size:7px">Nama wali kelas saat ini</span>' : ''}</div>`;

        void tdFont;
        return `<div class="class-section">
${kopHtml}
<div class="title">LAPORAN HARIAN TERPADU SISWA — ${escapeHtml(report.class.name)}</div>
${report.is_provisional ? '<div class="prov">Laporan sementara — kegiatan sekolah masih berlangsung.</div>' : ''}
<table class="meta"><tr>
  <td><b>Tanggal</b>: ${escapeHtml(formatDateId(report.report_date))}</td>
  <td><b>Tahun Ajaran</b>: ${escapeHtml(report.academic_year.name)}</td>
  <td><b>Kelas</b>: ${escapeHtml(report.class.name)}</td>
  <td><b>Wali Kelas</b>: ${escapeHtml(homeroom)}${report.is_historical_mode ? ' (saat ini)' : ''}</td>
  <td><b>Jumlah Siswa</b>: ${report.class.student_count}</td>
  <td><b>Waktu Cetak</b>: ${escapeHtml(generated)}</td></tr></table>
${matrixHtml}
${summaryHtml}
${findingsHtml}
${notesHtml}
</div>`;
    }

    buildMultiPdfHtml(reports, { schoolProfile, logoDataUri, headerImageUri, sections = {} }) {
        const opts = {
            kop: sections.kop !== false,
            matrix: sections.matrix !== false,
            summary: sections.summary !== false,
            findings: sections.findings !== false,
            notes: sections.notes !== false
        };
        const bodyHtml = reports
            .map((r) => this._renderClassSectionHtml(r, { schoolProfile, logoDataUri, headerImageUri, opts }))
            .join('\n');

        return `<!doctype html><html lang="id"><head><meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 12mm 10mm 16mm 10mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #111827; margin: 0; }
  .class-section + .class-section { page-break-before: always; }
  .kop-banner { border-bottom: 2px solid #1f2937; padding-bottom: 4px; margin-bottom: 6px; text-align: center; }
  .kop-img { width: 100%; max-height: 90px; object-fit: contain; display: block; margin: 0 auto; }
  .header { display:flex; align-items:center; gap:10px; border-bottom:2px solid #1f2937; padding-bottom:6px; margin-bottom:6px; }
  .logo { width:44px; height:44px; object-fit:contain; }
  .school { font-size:13px; font-weight:bold; margin:0; } .addr { font-size:8px; color:#4b5563; margin:2px 0 0; }
  .title { text-align:center; font-size:12.5px; font-weight:bold; margin:6px 0 4px; }
  .prov { text-align:center; color:#92400e; background:#fffbeb; border:1px solid #f59e0b; padding:2px; font-weight:bold; margin-bottom:4px; }
  .meta { width:100%; font-size:8.5px; margin-bottom:5px; border-collapse:collapse; } .meta td { padding:1px 4px; border:none; text-align:left; }
  h3 { font-size:10px; margin:8px 0 3px; page-break-after:avoid; }
  table.grid { width:100%; border-collapse:collapse; table-layout:auto; }
  table.grid th, table.grid td { border:0.6px solid #9ca3af; padding:2px 3px; font-size:7.5px; vertical-align:middle; }
  table.grid.dense th, table.grid.dense td { font-size:6.5px; }
  table.grid th { background:#e5e7eb; text-align:center; font-weight:bold; }
  thead { display:table-header-group; } tr { page-break-inside:avoid; }
  .c { text-align:center; } .r { text-align:right; } .name { text-align:left; white-space:nowrap; }
  .legend { font-size:7.5px; margin:4px 0; color:#374151; }
  .sum { display:flex; flex-wrap:wrap; gap:4px; } .sum div { border:0.6px solid #9ca3af; padding:3px 8px; min-width:120px; } .sum b { font-size:11px; }
  .findings { page-break-before:always; }
  .findings ul, td ul { margin:0; padding-left:12px; } .ev { margin-bottom:3px; }
  .tag { display:inline-block; font-size:7px; padding:0 4px; border:0.5px solid #6b7280; margin:0 3px 2px 0; }
  .tag.p { background:#fee2e2; } .tag.i { background:#fef3c7; }
  .w-error { color:#991b1b; font-weight:bold; } .w-warning { color:#92400e; }
  .sign { margin-top:14px; width:200px; margin-left:auto; text-align:center; page-break-inside:avoid; }
  .disc { margin-top:8px; font-size:8px; font-style:italic; border:0.6px solid #9ca3af; padding:4px; page-break-inside:avoid; }
  section.keep { page-break-inside:avoid; }
</style></head><body>
${bodyHtml}
</body></html>`;
    }

    buildPdfHtml(report, ctx) {
        return this.buildMultiPdfHtml([report], ctx);
    }

    async generatePdf(query = {}, actor = {}) {
        const sections = {
            kop: parseBoolFlag(query.include_kop, true),
            matrix: parseBoolFlag(query.include_matrix, true),
            summary: parseBoolFlag(query.include_summary, true),
            findings: parseBoolFlag(query.include_findings, true),
            notes: parseBoolFlag(query.include_notes, true)
        };
        if (!sections.matrix && !sections.summary && !sections.findings && !sections.notes) {
            throw new AppError('Pilih minimal satu bagian laporan untuk dicetak.', 422, ERROR_CODES.VALIDATION_ERROR);
        }
        const reports = await this._loadMany(query, actor);
        const primary = reports[0];
        try {
            const [schoolProfile, docSetting] = await Promise.all([
                SchoolProfile.findOne({ attributes: ['name', 'address', 'city', 'logo', 'logo_light'] }),
                DocumentSetting.findOne({ where: { is_active: true }, order: [['id', 'ASC']], attributes: ['header_image', 'pdf_footer_text'] })
            ]);
            const logoDataUri = loadLocalLogoDataUri(schoolProfile?.logo || schoolProfile?.logo_light);
            const headerImageUri = loadLocalLogoDataUri(docSetting?.header_image) || loadLocalLogoDataUri('header.png');
            const html = this.buildMultiPdfHtml(reports, { schoolProfile, logoDataUri, headerImageUri, sections });
            const generated = formatGenerated(primary.generated_at, primary.timezone);
            const footerNote = escapeHtml(docSetting?.pdf_footer_text || 'Hasil pemeriksaan silang presensi — memerlukan verifikasi petugas.');

            const browser = await require('puppeteer').launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            try {
                const page = await browser.newPage();
                await page.setContent(html, { waitUntil: 'networkidle0' });
                const pdf = await page.pdf({
                    format: 'A4',
                    landscape: true,
                    printBackground: true,
                    displayHeaderFooter: true,
                    headerTemplate: '<span></span>',
                    footerTemplate: `<div style="width:100%;font-size:7px;color:#6b7280;padding:0 10mm;display:flex;justify-content:space-between;"><span>${footerNote} | Dicetak: ${escapeHtml(generated)}</span><span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span></div>`,
                    margin: { top: '12mm', right: '10mm', bottom: '16mm', left: '10mm' }
                });
                reports.forEach((r) => this._logExport(r, 'pdf', actor));
                const filename = reports.length === 1
                    ? buildFilename(primary, 'pdf')
                    : `Laporan-Harian-Terpadu-${reports.length}-Kelas-${primary.report_date}.pdf`;
                return { buffer: Buffer.from(pdf), filename };
            } finally {
                await browser.close();
            }
        } catch (error) {
            return this._fail(error, 'exportPdf', primary, actor);
        }
    }

    _fail(error, operation, report, actor) {
        if (error instanceof AppError) throw error;
        logger.error(error.message, {
            module: 'lesson-attendance',
            feature: 'integrated-daily-report',
            operation,
            request_id: actor.requestId || null,
            user_id: actor.userId || null,
            academic_year_id: report?.academic_year?.id || null,
            class_id: report?.class?.id || null,
            attendance_date: report?.report_date || null,
            error_code: ERROR_CODES.REPORT_EXPORT_FAILED,
            error_message: error.message,
            timestamp: new Date().toISOString(),
            stack: error.stack
        });
        throw new AppError('Gagal membuat file export laporan harian terpadu.', 500, ERROR_CODES.REPORT_EXPORT_FAILED);
    }
}

module.exports = new IntegratedDailyReportExportService();
module.exports.sanitizeExcelText = sanitizeExcelText;
module.exports.buildFilename = buildFilename;
