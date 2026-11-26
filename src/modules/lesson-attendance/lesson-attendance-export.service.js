'use strict';

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const db = require('../../models');
const { SchoolProfile, DocumentSetting } = db;
const pdfService = require('../../services/pdfService');
const reportService = require('./lesson-attendance-report.service');
const adminService = require('./lesson-attendance-admin.service');
const { ERROR_CODES, AppError } = require('./lesson-attendance.constants');

const MODE_TITLES = {
    class: 'Laporan Presensi Jam Pelajaran - Rekap Per Kelas',
    student: 'Laporan Presensi Jam Pelajaran - Rekap Per Siswa',
    teacher: 'Laporan Presensi Jam Pelajaran - Rekap Aktivitas Guru',
    subject: 'Laporan Presensi Jam Pelajaran - Rekap Per Mata Pelajaran',
    detail: 'Laporan Presensi Jam Pelajaran - Detail Transaksi'
};

const MODE_FILENAME_PART = {
    class: 'Rekap-Kelas',
    student: 'Rekap-Siswa',
    teacher: 'Rekap-Guru',
    subject: 'Rekap-Mapel',
    detail: 'Detail'
};

function sanitizeExcelText(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // Prevent Excel formula injection
    if (/^[=+\-@\t\r]/.test(str)) {
        return `'${str}`;
    }
    return str;
}

function escapeHtml(val) {
    return String(val ?? '').replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}

function formatDateId(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPct(pct) {
    if (pct === null || pct === undefined) return '-';
    return `${Number(pct).toFixed(2)}%`;
}

function buildFilename(mode, filters, ext) {
    const part = MODE_FILENAME_PART[mode] || 'Laporan';
    const raw = `Presensi-Jam-Pelajaran-${part}-${filters.date_from}_${filters.date_to}.${ext}`;
    return raw.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function loadLocalLogoDataUri(logoPath) {
    if (!logoPath || typeof logoPath !== 'string') return null;
    if (logoPath.startsWith('data:')) return logoPath;
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return null;

    const cleanRel = logoPath.replace(/^\/+/, '');
    const candidates = [
        path.resolve(__dirname, '../../../public', cleanRel),
        path.resolve(__dirname, '../../../public/uploads', cleanRel)
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            const ext = path.extname(candidate).toLowerCase().replace('.', '') || 'png';
            const mime = ext === 'jpg' ? 'jpeg' : ext;
            const b64 = fs.readFileSync(candidate).toString('base64');
            return `data:image/${mime};base64,${b64}`;
        }
    }
    return null;
}

class LessonAttendanceExportService {
    async _getReportDataset(mode, query, { maxDetailRows }) {
        if (!MODE_TITLES[mode]) {
            throw new AppError('Mode laporan tidak valid.', 400, ERROR_CODES.VALIDATION_ERROR);
        }

        let dataset;
        if (mode === 'class') dataset = await reportService.getClassReport(query);
        else if (mode === 'student') dataset = await reportService.getStudentReport(query);
        else if (mode === 'teacher') dataset = await reportService.getTeacherReport(query);
        else if (mode === 'subject') dataset = await reportService.getSubjectReport(query);
        else dataset = await reportService.getDetailReport(query, { paginate: false, maxLimit: maxDetailRows });

        const [schoolProfile, docSetting, filterSummary] = await Promise.all([
            SchoolProfile.findOne({ attributes: ['name', 'short_name', 'address', 'city', 'phone', 'logo', 'logo_light'] }),
            DocumentSetting.findOne({ where: { is_active: true }, order: [['id', 'ASC']] }),
            reportService.describeActiveFilters(dataset.filters)
        ]);

        return {
            mode,
            title: MODE_TITLES[mode],
            dataset,
            schoolProfile,
            docSetting,
            filterSummary,
            printedAt: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
        };
    }

    _getColumnsAndRows(mode, dataset) {
        const rows = dataset.rows || [];
        const gt = dataset.grand_total || null;

        if (mode === 'class') {
            return {
                columns: [
                    { header: 'No', key: 'no', width: 6, align: 'center', type: 'number' },
                    { header: 'Kelas', key: 'class_name', width: 22, align: 'left', type: 'text' },
                    { header: 'Sesi Tercatat', key: 'sessions_count', width: 14, align: 'right', type: 'number' },
                    { header: 'Total Record', key: 'total_records', width: 14, align: 'right', type: 'number' },
                    { header: 'H', key: 'hadir', width: 9, align: 'right', type: 'number' },
                    { header: 'T', key: 'terlambat', width: 9, align: 'right', type: 'number' },
                    { header: 'I', key: 'izin', width: 9, align: 'right', type: 'number' },
                    { header: 'S', key: 'sakit', width: 9, align: 'right', type: 'number' },
                    { header: 'A', key: 'alpa', width: 9, align: 'right', type: 'number' },
                    { header: 'Kehadiran (%)', key: 'attendance_percentage', width: 15, align: 'right', type: 'percent' }
                ],
                data: rows.map((r, i) => ({ no: i + 1, ...r })),
                totalRow: gt ? {
                    no: '',
                    class_name: 'TOTAL KESELURUHAN',
                    sessions_count: gt.sessions_count,
                    total_records: gt.total_records,
                    hadir: gt.hadir,
                    terlambat: gt.terlambat,
                    izin: gt.izin,
                    sakit: gt.sakit,
                    alpa: gt.alpa,
                    attendance_percentage: gt.attendance_percentage
                } : null
            };
        }

        if (mode === 'student') {
            return {
                columns: [
                    { header: 'No', key: 'no', width: 6, align: 'center', type: 'number' },
                    { header: 'NIS', key: 'nis', width: 16, align: 'left', type: 'nis' },
                    { header: 'Nama Siswa', key: 'student_name', width: 28, align: 'left', type: 'text' },
                    { header: 'Kelas Tercatat', key: 'class_name', width: 18, align: 'left', type: 'text' },
                    { header: 'Total Jam', key: 'total_periods', width: 12, align: 'right', type: 'number' },
                    { header: 'H', key: 'hadir', width: 8, align: 'right', type: 'number' },
                    { header: 'T', key: 'terlambat', width: 8, align: 'right', type: 'number' },
                    { header: 'I', key: 'izin', width: 8, align: 'right', type: 'number' },
                    { header: 'S', key: 'sakit', width: 8, align: 'right', type: 'number' },
                    { header: 'A', key: 'alpa', width: 8, align: 'right', type: 'number' },
                    { header: 'Kehadiran (%)', key: 'attendance_percentage', width: 15, align: 'right', type: 'percent' }
                ],
                data: rows.map((r, i) => ({ no: i + 1, ...r })),
                totalRow: gt ? {
                    no: '',
                    nis: '',
                    student_name: 'TOTAL KESELURUHAN',
                    class_name: '',
                    total_periods: gt.total_periods,
                    hadir: gt.hadir,
                    terlambat: gt.terlambat,
                    izin: gt.izin,
                    sakit: gt.sakit,
                    alpa: gt.alpa,
                    attendance_percentage: gt.attendance_percentage
                } : null
            };
        }

        if (mode === 'teacher') {
            return {
                columns: [
                    { header: 'No', key: 'no', width: 6, align: 'center', type: 'number' },
                    { header: 'Nama Guru', key: 'teacher_name', width: 28, align: 'left', type: 'text' },
                    { header: 'Jml Kelas', key: 'classes_count', width: 12, align: 'right', type: 'number' },
                    { header: 'Jml Mapel', key: 'subjects_count', width: 12, align: 'right', type: 'number' },
                    { header: 'Sesi Tercatat', key: 'sessions_count', width: 14, align: 'right', type: 'number' },
                    { header: 'Via QR', key: 'qr_sessions', width: 10, align: 'right', type: 'number' },
                    { header: 'Via Admin', key: 'admin_sessions', width: 12, align: 'right', type: 'number' },
                    { header: 'Total Record', key: 'total_records', width: 14, align: 'right', type: 'number' }
                ],
                data: rows.map((r, i) => ({ no: i + 1, ...r })),
                totalRow: gt ? {
                    no: '',
                    teacher_name: 'TOTAL KESELURUHAN',
                    classes_count: '',
                    subjects_count: '',
                    sessions_count: gt.sessions_count,
                    qr_sessions: gt.qr_sessions,
                    admin_sessions: gt.admin_sessions,
                    total_records: gt.total_records
                } : null
            };
        }

        if (mode === 'subject') {
            return {
                columns: [
                    { header: 'No', key: 'no', width: 6, align: 'center', type: 'number' },
                    { header: 'Mata Pelajaran', key: 'subject_name', width: 28, align: 'left', type: 'text' },
                    { header: 'Jml Kelas', key: 'classes_count', width: 12, align: 'right', type: 'number' },
                    { header: 'Sesi Tercatat', key: 'sessions_count', width: 14, align: 'right', type: 'number' },
                    { header: 'Total Record', key: 'total_records', width: 14, align: 'right', type: 'number' },
                    { header: 'H', key: 'hadir', width: 8, align: 'right', type: 'number' },
                    { header: 'T', key: 'terlambat', width: 8, align: 'right', type: 'number' },
                    { header: 'I', key: 'izin', width: 8, align: 'right', type: 'number' },
                    { header: 'S', key: 'sakit', width: 8, align: 'right', type: 'number' },
                    { header: 'A', key: 'alpa', width: 8, align: 'right', type: 'number' },
                    { header: 'Kehadiran (%)', key: 'attendance_percentage', width: 15, align: 'right', type: 'percent' }
                ],
                data: rows.map((r, i) => ({ no: i + 1, ...r })),
                totalRow: gt ? {
                    no: '',
                    subject_name: 'TOTAL KESELURUHAN',
                    classes_count: '',
                    sessions_count: gt.sessions_count,
                    total_records: gt.total_records,
                    hadir: gt.hadir,
                    terlambat: gt.terlambat,
                    izin: gt.izin,
                    sakit: gt.sakit,
                    alpa: gt.alpa,
                    attendance_percentage: gt.attendance_percentage
                } : null
            };
        }

        // detail
        return {
            columns: [
                { header: 'No', key: 'no', width: 6, align: 'center', type: 'number' },
                { header: 'Tanggal', key: 'attendance_date', width: 14, align: 'center', type: 'date' },
                { header: 'Kelas', key: 'class_name', width: 16, align: 'left', type: 'text' },
                { header: 'Jam', key: 'period_number', width: 8, align: 'center', type: 'number' },
                { header: 'Mata Pelajaran', key: 'subject_name', width: 22, align: 'left', type: 'text' },
                { header: 'Guru', key: 'teacher_name', width: 24, align: 'left', type: 'text' },
                { header: 'NIS', key: 'nis', width: 15, align: 'left', type: 'nis' },
                { header: 'Nama Siswa', key: 'student_name', width: 26, align: 'left', type: 'text' },
                { header: 'Status', key: 'status', width: 12, align: 'center', type: 'text' },
                { header: 'Catatan', key: 'notes', width: 28, align: 'left', type: 'wrap' }
            ],
            data: rows.map((r, i) => ({ no: i + 1, ...r })),
            totalRow: null
        };
    }

    async generateExcel(mode, query = {}) {
        const ctx = await this._getReportDataset(mode, query, { maxDetailRows: 25000 });
        const { columns, data, totalRow } = this._getColumnsAndRows(mode, ctx.dataset);
        const { filters } = ctx.dataset;

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Edulite';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Laporan Presensi', {
            views: [{ state: 'frozen', ySplit: 7 }]
        });

        const colCount = columns.length;
        const lastColLetter = sheet.getColumn(colCount).letter;

        // Header metadata rows
        sheet.mergeCells(`A1:${lastColLetter}1`);
        sheet.getCell('A1').value = sanitizeExcelText(ctx.schoolProfile?.name || 'SEKOLAH');
        sheet.getCell('A1').font = { bold: true, size: 14 };

        sheet.mergeCells(`A2:${lastColLetter}2`);
        sheet.getCell('A2').value = sanitizeExcelText(ctx.title);
        sheet.getCell('A2').font = { bold: true, size: 12 };

        sheet.mergeCells(`A3:${lastColLetter}3`);
        sheet.getCell('A3').value = `Tahun Ajaran: ${filters.academic_year_name} | Periode: ${formatDateId(filters.date_from)} s.d. ${formatDateId(filters.date_to)}`;
        sheet.getCell('A3').font = { size: 10 };

        sheet.mergeCells(`A4:${lastColLetter}4`);
        sheet.getCell('A4').value = `Filter: ${sanitizeExcelText(ctx.filterSummary)}`;
        sheet.getCell('A4').font = { size: 10 };

        sheet.mergeCells(`A5:${lastColLetter}5`);
        sheet.getCell('A5').value = `Waktu Cetak: ${ctx.printedAt} WIB`;
        sheet.getCell('A5').font = { italic: true, size: 9, color: { argb: 'FF555555' } };

        // Row 6 blank, Row 7 table header
        const headerRowIdx = 7;
        const headerRow = sheet.getRow(headerRowIdx);
        columns.forEach((col, idx) => {
            const cell = headerRow.getCell(idx + 1);
            cell.value = col.header;
            cell.font = { bold: true, size: 10 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
            cell.alignment = { vertical: 'middle', horizontal: col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            sheet.getColumn(idx + 1).width = col.width;
        });
        headerRow.height = 24;

        sheet.autoFilter = {
            from: { row: headerRowIdx, column: 1 },
            to: { row: headerRowIdx, column: colCount }
        };

        const writeDataRow = (rowObj, isTotal = false) => {
            const row = sheet.addRow([]);
            columns.forEach((col, idx) => {
                const cell = row.getCell(idx + 1);
                const rawVal = rowObj[col.key];

                if (col.type === 'number') {
                    cell.value = rawVal === '' || rawVal === null || rawVal === undefined ? '' : Number(rawVal);
                    cell.numFmt = '#,##0';
                } else if (col.type === 'percent') {
                    if (rawVal === null || rawVal === undefined || rawVal === '') {
                        cell.value = '-';
                    } else {
                        cell.value = Number(rawVal) / 100;
                        cell.numFmt = '0.00%';
                    }
                } else if (col.type === 'nis') {
                    cell.value = sanitizeExcelText(rawVal || '-');
                    cell.numFmt = '@';
                } else if (col.type === 'date') {
                    cell.value = formatDateId(rawVal);
                } else {
                    cell.value = sanitizeExcelText(rawVal ?? '-');
                }

                cell.alignment = {
                    vertical: 'middle',
                    horizontal: col.align,
                    wrapText: col.type === 'wrap'
                };
                cell.font = { bold: isTotal, size: 10 };
                if (isTotal) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
                }
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        };

        for (const item of data) {
            writeDataRow(item, false);
        }
        if (totalRow) {
            writeDataRow(totalRow, true);
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return {
            buffer: Buffer.from(buffer),
            filename: buildFilename(mode, filters, 'xlsx')
        };
    }

    async generatePdf(mode, query = {}) {
        const ctx = await this._getReportDataset(mode, query, { maxDetailRows: 2500 });
        const { columns, data, totalRow } = this._getColumnsAndRows(mode, ctx.dataset);
        const { filters } = ctx.dataset;

        const isLandscape = ['student', 'teacher', 'detail'].includes(mode);
        const logoDataUri = loadLocalLogoDataUri(ctx.schoolProfile?.logo || ctx.schoolProfile?.logo_light);

        const renderCell = (col, rowObj) => {
            const raw = rowObj[col.key];
            if (col.type === 'percent') return escapeHtml(formatPct(raw));
            if (col.type === 'date') return escapeHtml(formatDateId(raw));
            if (col.type === 'number') {
                return raw === '' || raw === null || raw === undefined ? '' : escapeHtml(Number(raw).toLocaleString('id-ID'));
            }
            return escapeHtml(raw ?? '-');
        };

        const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 14mm 12mm 16mm 12mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #111827; margin: 0; }
  .header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #1f2937; padding-bottom: 8px; margin-bottom: 10px; }
  .logo { width: 48px; height: 48px; object-fit: contain; }
  .school-name { font-size: 14px; font-weight: bold; margin: 0; }
  .school-addr { font-size: 9px; color: #4b5563; margin: 2px 0 0; }
  .title-block { text-align: center; margin: 8px 0 10px; }
  .title-block h1 { font-size: 13px; margin: 0; text-transform: uppercase; }
  .meta { font-size: 9px; color: #374151; margin-bottom: 8px; display: flex; justify-content: space-between; gap: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 9px; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th, td { border: 1px solid #d1d5db; padding: 4px 6px; vertical-align: middle; }
  th { background: #f3f4f6; font-weight: bold; text-align: center; }
  .align-left { text-align: left; }
  .align-center { text-align: center; }
  .align-right { text-align: right; }
  .total-row td { background: #f3f4f6; font-weight: bold; }
  .wrap { white-space: normal; word-break: break-word; }
</style>
</head>
<body>
  <div class="header">
    ${logoDataUri ? `<img class="logo" src="${logoDataUri}" alt="Logo" />` : ''}
    <div>
      <p class="school-name">${escapeHtml(ctx.schoolProfile?.name || 'SEKOLAH')}</p>
      <p class="school-addr">${escapeHtml(ctx.schoolProfile?.address || '')}${ctx.schoolProfile?.city ? ` - ${escapeHtml(ctx.schoolProfile.city)}` : ''}</p>
    </div>
  </div>
  <div class="title-block">
    <h1>${escapeHtml(ctx.title)}</h1>
  </div>
  <div class="meta">
    <div>
      <strong>Tahun Ajaran:</strong> ${escapeHtml(filters.academic_year_name)} |
      <strong>Periode:</strong> ${escapeHtml(formatDateId(filters.date_from))} s.d. ${escapeHtml(formatDateId(filters.date_to))}<br/>
      <strong>Filter:</strong> ${escapeHtml(ctx.filterSummary)}
    </div>
    <div style="text-align:right;">
      <strong>Dicetak:</strong> ${escapeHtml(ctx.printedAt)} WIB
    </div>
  </div>
  <table>
    <thead>
      <tr>
        ${columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.length === 0
        ? `<tr><td colspan="${columns.length}" class="align-center">Tidak ada data presensi pada periode/filter yang dipilih.</td></tr>`
        : data.map((row) => `<tr>${columns.map((c) => `<td class="align-${c.align} ${c.type === 'wrap' ? 'wrap' : ''}">${renderCell(c, row)}</td>`).join('')}</tr>`).join('')
      }
      ${totalRow ? `<tr class="total-row">${columns.map((c) => `<td class="align-${c.align}">${renderCell(c, totalRow)}</td>`).join('')}</tr>` : ''}
    </tbody>
  </table>
</body>
</html>`;

        const browser = await require('puppeteer').launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const footerText = escapeHtml(ctx.docSetting?.pdf_footer_text || 'Edulite - Presensi Jam Pelajaran');
            const pdf = await page.pdf({
                format: 'A4',
                landscape: isLandscape,
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: '<span></span>',
                footerTemplate: `<div style="width:100%;font-size:8px;color:#6b7280;padding:0 12mm;display:flex;justify-content:space-between;"><span>${footerText}</span><span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span></div>`,
                margin: { top: '14mm', right: '12mm', bottom: '16mm', left: '12mm' }
            });

            return {
                buffer: Buffer.from(pdf),
                filename: buildFilename(mode, filters, 'pdf')
            };
        } finally {
            await browser.close();
        }
    }

    async generateMonitoringPdf(query = {}) {
        const monitoring = await adminService.getMonitoring({
            attendanceDate: query.attendance_date,
            academicYearId: query.academic_year_id,
            gradeId: query.grade_id,
            departmentId: query.department_id,
            classId: query.class_id,
            status: query.status,
            search: query.search
        });

        const [schoolProfile, docSetting] = await Promise.all([
            SchoolProfile.findOne({ attributes: ['name', 'address', 'city', 'logo', 'logo_light'] }),
            DocumentSetting.findOne({ where: { is_active: true }, order: [['id', 'ASC']], attributes: ['header_image', 'pdf_footer_text'] })
        ]);

        const headerImageUri = loadLocalLogoDataUri(docSetting?.header_image) || loadLocalLogoDataUri('header.png');
        const logoDataUri = loadLocalLogoDataUri(schoolProfile?.logo || schoolProfile?.logo_light);
        const printedAt = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const periods = monitoring.periods || [];
        const rows = monitoring.rows || [];

        const kopHtml = headerImageUri
            ? `<div class="kop-banner"><img class="kop-img" src="${headerImageUri}" alt="Kop Sekolah" /></div>`
            : `<div class="header">
                ${logoDataUri ? `<img class="logo" src="${logoDataUri}" alt="Logo" />` : ''}
                <div>
                  <p class="school-name">${escapeHtml(schoolProfile?.name || 'SEKOLAH')}</p>
                  <p class="school-addr">${escapeHtml(schoolProfile?.address || '')}${schoolProfile?.city ? ` - ${escapeHtml(schoolProfile.city)}` : ''}</p>
                </div>
              </div>`;

        const cellMeta = (status) => {
            if (status === 'SUBMITTED') return { code: '✓', css: 'background:#dcfce7;color:#166534;font-weight:bold;' };
            if (status === 'NOT_RECORDED') return { code: '–', css: 'background:#fee2e2;color:#991b1b;font-weight:bold;' };
            if (status === 'UPCOMING') return { code: '◷', css: 'background:#f3f4f6;color:#6b7280;' };
            if (status === 'CANCELLED') return { code: '✕', css: 'background:#fef3c7;color:#92400e;font-weight:bold;' };
            return { code: '?', css: 'background:#f1f5f9;color:#475569;' };
        };

        const unrecordedClasses = [];
        const matrixRowsHtml = rows.length === 0
            ? `<tr><td colspan="${3 + periods.length}" class="c">Tidak ada kelas atau transaksi presensi yang sesuai dengan filter pada tanggal ini.</td></tr>`
            : rows.map((r, idx) => {
                const missingPeriods = [];
                const cellsHtml = periods.map((p) => {
                    const cell = r.cells?.[p.period_number];
                    const st = cell?.status || 'UNKNOWN';
                    if (st === 'NOT_RECORDED') {
                        missingPeriods.push({
                            number: p.period_number,
                            time: `${String(p.start_time || '').slice(0, 5)}–${String(p.end_time || '').slice(0, 5)}`
                        });
                    }
                    const m = cellMeta(st);
                    return `<td class="c" style="${m.css}">${m.code}</td>`;
                }).join('');

                if (missingPeriods.length > 0) {
                    unrecordedClasses.push({
                        class_name: r.class_name,
                        active_student_count: r.active_student_count,
                        missing: missingPeriods
                    });
                }

                const missingLabels = missingPeriods.length
                    ? missingPeriods.map((m) => `J${m.number}`).join(', ')
                    : '-';

                return `<tr>
                    <td class="c">${idx + 1}</td>
                    <td class="name"><strong>${escapeHtml(r.class_name)}</strong>${r.active_student_count > 0 ? `<div class="sub">${r.active_student_count} siswa aktif</div>` : ''}</td>
                    ${cellsHtml}
                    <td class="c" style="${missingPeriods.length ? 'color:#991b1b;font-weight:bold;background:#fff5f5;' : 'color:#166534;'}">${escapeHtml(missingLabels)}</td>
                </tr>`;
            }).join('');

        const unrecordedTableHtml = unrecordedClasses.length === 0
            ? '<p class="ok-box">Semua jam pelajaran yang sudah berlangsung telah terabsen pada seluruh kelas yang dipantau.</p>'
            : `<table class="grid">
                <thead>
                  <tr>
                    <th style="width:28px;">No</th>
                    <th style="width:160px;">Kelas</th>
                    <th style="width:85px;">Jumlah Jam Belum Diabsen</th>
                    <th>Jam Pelajaran Belum Diabsen</th>
                  </tr>
                </thead>
                <tbody>
                  ${unrecordedClasses.map((u, i) => `<tr>
                    <td class="c">${i + 1}</td>
                    <td class="name"><strong>${escapeHtml(u.class_name)}</strong></td>
                    <td class="c" style="color:#991b1b;font-weight:bold;">${u.missing.length}</td>
                    <td class="name">${escapeHtml(u.missing.map((m) => `J${m.number} (${m.time})`).join(', '))}</td>
                  </tr>`).join('')}
                </tbody>
              </table>`;

        const sum = monitoring.summary || {};
        const html = `<!doctype html><html lang="id"><head><meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 12mm 10mm 15mm 10mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #111827; margin: 0; }
  .kop-banner { border-bottom: 2px solid #1f2937; padding-bottom: 4px; margin-bottom: 6px; text-align: center; }
  .kop-img { width: 100%; max-height: 90px; object-fit: contain; display: block; margin: 0 auto; }
  .header { display:flex; align-items:center; gap:10px; border-bottom:2px solid #1f2937; padding-bottom:6px; margin-bottom:6px; }
  .logo { width:42px; height:42px; object-fit:contain; }
  .school-name { font-size:13px; font-weight:bold; margin:0; }
  .school-addr { font-size:8px; color:#4b5563; margin:2px 0 0; }
  .title { text-align:center; font-size:12.5px; font-weight:bold; margin:6px 0 4px; text-transform:uppercase; }
  .meta { display:flex; justify-content:space-between; font-size:8.5px; color:#374151; margin-bottom:6px; }
  .sum { display:flex; gap:8px; margin-bottom:8px; }
  .sum div { border:0.6px solid #9ca3af; padding:4px 10px; min-width:115px; }
  .sum b { font-size:11px; display:block; }
  h3 { font-size:10px; margin:8px 0 4px; page-break-after:avoid; }
  table.grid { width:100%; border-collapse:collapse; font-size:8px; }
  table.grid th, table.grid td { border:0.6px solid #9ca3af; padding:3px 4px; vertical-align:middle; }
  table.grid th { background:#e5e7eb; font-weight:bold; text-align:center; }
  thead { display:table-header-group; } tr { page-break-inside:avoid; }
  .c { text-align:center; } .name { text-align:left; }
  .sub { font-size:7px; color:#6b7280; font-weight:normal; }
  .legend { font-size:7.5px; color:#374151; margin:4px 0 8px; }
  .ok-box { background:#ecfdf5; border:0.6px solid #10b981; color:#065f46; padding:6px 8px; font-weight:bold; }
  .note { margin-top:8px; font-size:8px; color:#4b5563; background:#f9fafb; border:0.6px solid #d1d5db; padding:4px 6px; }
  .section-block { margin-top:10px; }
</style></head><body>
  ${kopHtml}
  <div class="title">Laporan Monitoring Presensi Jam Pelajaran</div>
  <div class="meta">
    <div>
      <strong>Tanggal:</strong> ${escapeHtml(formatDateId(monitoring.attendance_date))} |
      <strong>Tahun Ajaran:</strong> ${escapeHtml(monitoring.academic_year?.name || '-')} |
      <strong>Status:</strong> ${monitoring.is_today ? 'Hari Ini (Berjalan)' : 'Historis'}
    </div>
    <div style="text-align:right;"><strong>Dicetak:</strong> ${escapeHtml(printedAt)} WIB</div>
  </div>
  <div class="sum">
    <div>Kelas Dipantau<b>${sum.total_classes ?? 0}</b></div>
    <div>Jam Sudah Diabsen<b style="color:#166534;">${sum.submitted_count ?? 0}</b></div>
    <div>Jam Belum Diabsen<b style="color:#991b1b;">${sum.not_recorded_count ?? 0}</b></div>
    <div>Jam Dibatalkan<b style="color:#92400e;">${sum.cancelled_count ?? 0}</b></div>
  </div>
  <h3>A. Matriks Status Pengisian Presensi Per Kelas</h3>
  <table class="grid">
    <thead>
      <tr>
        <th style="width:24px;">No</th>
        <th style="width:140px;">Kelas</th>
        ${periods.map((p) => `<th>J${p.period_number}<br/><span style="font-weight:normal;font-size:7px;">${escapeHtml(String(p.start_time || '').slice(0, 5))}</span></th>`).join('')}
        <th style="width:95px;">Belum Diabsen</th>
      </tr>
    </thead>
    <tbody>${matrixRowsHtml}</tbody>
  </table>
  <div class="legend"><strong>Legenda:</strong> ✓ = Sudah Diabsen | – = Belum Diabsen | ◷ = Belum Dimulai | ✕ = Dibatalkan | ? = Tidak Diketahui</div>

  <div class="section-block">
    <h3>B. Daftar Kelas yang Belum Diabsen</h3>
    ${unrecordedTableHtml}
  </div>
  ${monitoring.note ? `<div class="note"><strong>Catatan:</strong> ${escapeHtml(monitoring.note)}</div>` : ''}
</body></html>`;

        const browser = await require('puppeteer').launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const footerText = escapeHtml(docSetting?.pdf_footer_text || 'Edulite - Monitoring Presensi Jam Pelajaran');
            const pdf = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: '<span></span>',
                footerTemplate: `<div style="width:100%;font-size:7.5px;color:#6b7280;padding:0 10mm;display:flex;justify-content:space-between;"><span>${footerText} | Dicetak: ${escapeHtml(printedAt)} WIB</span><span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span></div>`,
                margin: { top: '12mm', right: '10mm', bottom: '15mm', left: '10mm' }
            });
            const filename = `Monitoring-Presensi-Jam-Pelajaran-${monitoring.attendance_date}.pdf`;
            return { buffer: Buffer.from(pdf), filename };
        } finally {
            await browser.close();
        }
    }
}

module.exports = new LessonAttendanceExportService();
