'use strict';

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const db = require('../../models');
const { SchoolProfile, Class, DocumentSetting } = db;
const dailyReportService = require('./lesson-attendance-daily-report.service');
const logger = require('../../core/logger');

const CELL_CODE_MAP = {
    HADIR: 'H',
    TERLAMBAT: 'T',
    IZIN: 'I',
    SAKIT: 'S',
    ALPA: 'A',
    NOT_RECORDED: '-',
    MISSING_DETAIL: '?',
    CANCELLED: '✕',
    UPCOMING: '◷',
    NOT_APPLICABLE: 'N/A'
};

const EXCEL_STATUS_STYLE = {
    HADIR: { fg: 'FFD1FAE5', font: 'FF065F46' },
    TERLAMBAT: { fg: 'FFFEF3C7', font: 'FF92400E' },
    IZIN: { fg: 'FFDBEAFE', font: 'FF1E40AF' },
    SAKIT: { fg: 'FFEDE9FE', font: 'FF5B21B6' },
    ALPA: { fg: 'FFFEE2E2', font: 'FF991B1B' },
    NOT_RECORDED: { fg: 'FFF3F4F6', font: 'FF6B7280' },
    MISSING_DETAIL: { fg: 'FFFEF3C7', font: 'FFB45309' },
    CANCELLED: { fg: 'FFF3F4F6', font: 'FF92400E' },
    UPCOMING: { fg: 'FFF3F4F6', font: 'FF6B7280' }
};

function sanitizeExcelText(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (/^[=+\-@\t\r]/.test(str)) return `'${str}`;
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
            return `data:image/${mime};base64,${fs.readFileSync(candidate).toString('base64')}`;
        }
    }
    return null;
}

async function buildFilename(classId, dateStr, ext) {
    let classSlug = '';
    if (classId) {
        const cls = await Class.findByPk(Number(classId), { attributes: ['name'] });
        if (cls?.name) {
            classSlug = `-${cls.name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '')}`;
        }
    }
    return `Laporan-Harian-Siswa${classSlug}-${dateStr}.${ext}`;
}

class LessonAttendanceDailyExportService {
    async generateExcel(query = {}, actorUserId = null) {
        const data = await dailyReportService.buildDailyMatrix(query, { paginate: false, maxExportRows: 15000 });
        const [schoolProfile, filterDesc, filename] = await Promise.all([
            SchoolProfile.findOne({ attributes: ['name', 'address', 'city'] }),
            dailyReportService.describeFilters(data.applied_filters),
            buildFilename(data.applied_filters.class_id, data.attendance_date, 'xlsx')
        ]);

        const printedAt = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const periods = data.periods || [];
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Edulite';
        workbook.created = new Date();

        // Sheet 1: Laporan Harian Matrix
        const sheet = workbook.addWorksheet('Laporan Harian', {
            views: [{ state: 'frozen', xSplit: 4, ySplit: 7 }]
        });

        const totalCols = 4 + periods.length + 7; // No, NIS, Nama, Kelas + Periods + H,T,I,S,A + Jam Bolos + Keterangan
        const lastColLetter = sheet.getColumn(totalCols).letter;

        sheet.mergeCells(`A1:${lastColLetter}1`);
        sheet.getCell('A1').value = sanitizeExcelText(schoolProfile?.name || 'SEKOLAH');
        sheet.getCell('A1').font = { bold: true, size: 14 };

        sheet.mergeCells(`A2:${lastColLetter}2`);
        sheet.getCell('A2').value = 'Laporan Harian Presensi Siswa Per Jam Pelajaran';
        sheet.getCell('A2').font = { bold: true, size: 12 };

        sheet.mergeCells(`A3:${lastColLetter}3`);
        sheet.getCell('A3').value = `Tanggal: ${formatDateId(data.attendance_date)} | Tahun Ajaran: ${data.academic_year.name}`;
        sheet.getCell('A3').font = { size: 10 };

        sheet.mergeCells(`A4:${lastColLetter}4`);
        sheet.getCell('A4').value = `Filter: ${sanitizeExcelText(filterDesc)} | Keterangan: H=Hadir, T=Terlambat, I=Izin, S=Sakit, A=Alpa, -=Belum Tercatat, ◷=Belum Mulai, ✕=Dibatalkan`;
        sheet.getCell('A4').font = { size: 9 };

        sheet.mergeCells(`A5:${lastColLetter}5`);
        sheet.getCell('A5').value = `Dicetak: ${printedAt} WIB | Catatan: Indikasi bolos dihitung berdasarkan status ALPA setelah siswa tercatat hadir dan memerlukan verifikasi petugas.`;
        sheet.getCell('A5').font = { italic: true, size: 9, color: { argb: 'FF555555' } };

        const headers = [
            'No',
            'NIS',
            'Nama Siswa',
            'Kelas',
            ...periods.map((p) => `${p.label}\n(${p.start_time}-${p.end_time})`),
            'H',
            'T',
            'I',
            'S',
            'A',
            'Jam Terindikasi Bolos',
            'Keterangan Indikasi'
        ];

        const headerRow = sheet.getRow(7);
        headers.forEach((h, idx) => {
            const cell = headerRow.getCell(idx + 1);
            cell.value = h;
            cell.font = { bold: true, size: 9 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
            cell.alignment = { vertical: 'middle', horizontal: idx >= 4 ? 'center' : 'left', wrapText: true };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
        headerRow.height = 28;

        sheet.getColumn(1).width = 5;
        sheet.getColumn(2).width = 14;
        sheet.getColumn(3).width = 26;
        sheet.getColumn(4).width = 14;
        periods.forEach((_, idx) => { sheet.getColumn(5 + idx).width = 10; });
        const sumStartCol = 5 + periods.length;
        for (let i = 0; i < 5; i += 1) sheet.getColumn(sumStartCol + i).width = 6;
        sheet.getColumn(sumStartCol + 5).width = 18;
        sheet.getColumn(sumStartCol + 6).width = 30;

        sheet.autoFilter = {
            from: { row: 7, column: 1 },
            to: { row: 7, column: totalCols }
        };

        data.students.forEach((st, idx) => {
            const row = sheet.addRow([]);
            row.getCell(1).value = idx + 1;
            row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

            row.getCell(2).value = sanitizeExcelText(st.nis || '-');
            row.getCell(2).numFmt = '@';
            row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };

            row.getCell(3).value = sanitizeExcelText(st.student_name);
            row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };

            row.getCell(4).value = sanitizeExcelText(st.class_name);
            row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };

            st.attendance.forEach((cellData, pIdx) => {
                const c = row.getCell(5 + pIdx);
                c.value = CELL_CODE_MAP[cellData.status] || '-';
                c.alignment = { horizontal: 'center', vertical: 'middle' };
                const style = EXCEL_STATUS_STYLE[cellData.status];
                if (style) {
                    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fg } };
                    c.font = { bold: cellData.status === 'ALPA', size: 9, color: { argb: style.font } };
                }
            });

            const numVals = [st.summary.hadir, st.summary.terlambat, st.summary.izin, st.summary.sakit, st.summary.alpa];
            numVals.forEach((val, i) => {
                const c = row.getCell(sumStartCol + i);
                c.value = Number(val);
                c.numFmt = '#,##0';
                c.alignment = { horizontal: 'right', vertical: 'middle' };
            });

            const truancyCell = row.getCell(sumStartCol + 5);
            truancyCell.value = sanitizeExcelText(st.potential_truancy_episodes_text || '-');
            truancyCell.alignment = { horizontal: 'center', vertical: 'middle' };

            const noteCell = row.getCell(sumStartCol + 6);
            noteCell.value = sanitizeExcelText(st.indication_summary || '-');
            noteCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

            for (let cIdx = 1; cIdx <= totalCols; cIdx += 1) {
                row.getCell(cIdx).border = {
                    top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
                };
            }
        });

        // Sheet 2: Indikasi Bolos
        const truancyStudents = data.students.filter((s) => s.potential_truancy);
        const sheet2 = workbook.addWorksheet('Indikasi Bolos', {
            views: [{ state: 'frozen', ySplit: 4 }]
        });
        sheet2.mergeCells('A1:H1');
        sheet2.getCell('A1').value = `Daftar Siswa Terindikasi Bolos — ${formatDateId(data.attendance_date)}`;
        sheet2.getCell('A1').font = { bold: true, size: 12 };
        sheet2.mergeCells('A2:H2');
        sheet2.getCell('A2').value = 'Catatan: Dihitung berdasarkan status ALPA setelah siswa tercatat hadir. Memerlukan verifikasi petugas.';
        sheet2.getCell('A2').font = { italic: true, size: 9, color: { argb: 'FF555555' } };

        const s2Headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Jam ALPA Setelah Hadir', 'Jumlah Jam Terindikasi', 'Jam Terakhir Hadir', 'Keterangan'];
        const s2HeaderRow = sheet2.getRow(4);
        s2Headers.forEach((h, i) => {
            const c = s2HeaderRow.getCell(i + 1);
            c.value = h;
            c.font = { bold: true, size: 10 };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
        [5, 14, 26, 16, 22, 18, 18, 32].forEach((w, i) => { sheet2.getColumn(i + 1).width = w; });

        truancyStudents.forEach((st, idx) => {
            const r = sheet2.addRow([
                idx + 1,
                sanitizeExcelText(st.nis || '-'),
                sanitizeExcelText(st.student_name),
                sanitizeExcelText(st.class_name),
                sanitizeExcelText(st.potential_truancy_episodes_text),
                st.potential_truancy_periods.length,
                st.last_recorded_present_period ? `J${st.last_recorded_present_period}` : '-',
                sanitizeExcelText(st.indication_summary)
            ]);
            r.getCell(2).numFmt = '@';
            r.getCell(6).numFmt = '#,##0';
            for (let i = 1; i <= 8; i += 1) {
                r.getCell(i).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();

        logger.info('Daily student lesson attendance Excel exported', {
            module: 'lesson-attendance',
            feature: 'daily-student-report',
            user_id: actorUserId,
            attendance_date: data.attendance_date,
            class_id: data.applied_filters.class_id,
            export_format: 'excel',
            record_count: data.students.length
        });

        return { buffer: Buffer.from(buffer), filename };
    }

    async generatePdf(query = {}, actorUserId = null) {
        const data = await dailyReportService.buildDailyMatrix(query, { paginate: false, maxExportRows: 2000 });
        const [schoolProfile, docSetting, filterDesc, filename] = await Promise.all([
            SchoolProfile.findOne({ attributes: ['name', 'address', 'city', 'logo', 'logo_light'] }),
            DocumentSetting.findOne({ where: { is_active: true }, order: [['id', 'ASC']] }),
            dailyReportService.describeFilters(data.applied_filters),
            buildFilename(data.applied_filters.class_id, data.attendance_date, 'pdf')
        ]);

        const printedAt = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const logoDataUri = loadLocalLogoDataUri(schoolProfile?.logo || schoolProfile?.logo_light);
        const periods = data.periods || [];

        const cellCss = (status) => {
            if (status === 'ALPA') return 'background:#fee2e2;color:#991b1b;font-weight:bold;';
            if (status === 'HADIR') return 'background:#dcfce7;color:#166534;';
            if (status === 'TERLAMBAT') return 'background:#fef3c7;color:#92400e;';
            if (status === 'IZIN') return 'background:#dbeafe;color:#1e40af;';
            if (status === 'SAKIT') return 'background:#ede9fe;color:#5b21b6;';
            return 'background:#f3f4f6;color:#6b7280;';
        };

        const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 12mm 10mm 15mm 10mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #111827; margin: 0; }
  .header { display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #1f2937; padding-bottom: 6px; margin-bottom: 8px; }
  .logo { width: 42px; height: 42px; object-fit: contain; }
  .school-name { font-size: 13px; font-weight: bold; margin: 0; }
  .school-addr { font-size: 8px; color: #4b5563; margin: 2px 0 0; }
  .title { text-align: center; font-size: 12px; font-weight: bold; margin: 6px 0; text-transform: uppercase; }
  .meta { display: flex; justify-content: space-between; font-size: 8.5px; color: #374151; margin-bottom: 6px; }
  .legend { font-size: 8px; color: #374151; margin-bottom: 6px; background: #f9fafb; padding: 4px 6px; border: 1px solid #e5e7eb; }
  table { width: 100%; border-collapse: collapse; font-size: 8px; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th, td { border: 1px solid #d1d5db; padding: 3px 4px; vertical-align: middle; }
  th { background: #f3f4f6; font-weight: bold; text-align: center; }
  .center { text-align: center; }
  .right { text-align: right; }
  .truancy-row { background: #fff5f5; }
</style>
</head>
<body>
  <div class="header">
    ${logoDataUri ? `<img class="logo" src="${logoDataUri}" alt="Logo" />` : ''}
    <div>
      <p class="school-name">${escapeHtml(schoolProfile?.name || 'SEKOLAH')}</p>
      <p class="school-addr">${escapeHtml(schoolProfile?.address || '')}${schoolProfile?.city ? ` - ${escapeHtml(schoolProfile.city)}` : ''}</p>
    </div>
  </div>
  <div class="title">Laporan Harian Presensi Siswa Per Jam Pelajaran</div>
  <div class="meta">
    <div>
      <strong>Tanggal:</strong> ${escapeHtml(formatDateId(data.attendance_date))} |
      <strong>Tahun Ajaran:</strong> ${escapeHtml(data.academic_year.name)}<br/>
      <strong>Filter:</strong> ${escapeHtml(filterDesc)}
    </div>
    <div style="text-align:right;">
      <strong>Total Siswa:</strong> ${data.filtered_count} | <strong>Terindikasi Bolos:</strong> ${data.students.filter((s) => s.potential_truancy).length}<br/>
      <strong>Dicetak:</strong> ${escapeHtml(printedAt)} WIB
    </div>
  </div>
  <div class="legend">
    <strong>Legenda:</strong> H = Hadir | T = Terlambat | I = Izin | S = Sakit | A = Alpa | - = Belum Tercatat | ◷ = Belum Dimulai | ✕ = Dibatalkan | ? = Detail Tidak Tersedia
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:24px;">No</th>
        <th style="width:65px;">NIS</th>
        <th>Nama Siswa</th>
        <th style="width:68px;">Kelas</th>
        ${periods.map((p) => `<th style="width:24px;">${escapeHtml(p.label)}<br/><span style="font-weight:normal;font-size:7px;">${escapeHtml(p.start_time)}</span></th>`).join('')}
        <th style="width:20px;">H</th>
        <th style="width:20px;">T</th>
        <th style="width:20px;">I</th>
        <th style="width:20px;">S</th>
        <th style="width:20px;">A</th>
        <th>Indikasi</th>
      </tr>
    </thead>
    <tbody>
      ${data.students.length === 0
        ? `<tr><td colspan="${10 + periods.length}" class="center">Tidak ada data siswa yang sesuai filter.</td></tr>`
        : data.students.map((st, idx) => `
          <tr class="${st.potential_truancy ? 'truancy-row' : ''}">
            <td class="center">${idx + 1}</td>
            <td>${escapeHtml(st.nis || '-')}</td>
            <td><strong>${escapeHtml(st.student_name)}</strong></td>
            <td>${escapeHtml(st.class_name)}</td>
            ${st.attendance.map((c) => `<td class="center" style="${cellCss(c.status)}">${escapeHtml(CELL_CODE_MAP[c.status] || '-')}</td>`).join('')}
            <td class="right">${st.summary.hadir}</td>
            <td class="right">${st.summary.terlambat}</td>
            <td class="right">${st.summary.izin}</td>
            <td class="right">${st.summary.sakit}</td>
            <td class="right" style="${st.summary.alpa > 0 ? 'color:#991b1b;font-weight:bold;' : ''}">${st.summary.alpa}</td>
            <td>${escapeHtml(st.indication_summary)}</td>
          </tr>
        `).join('')
      }
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
            const footerNote = escapeHtml(docSetting?.pdf_footer_text || 'Indikasi bolos dihitung berdasarkan status ALPA setelah hadir dan memerlukan verifikasi petugas.');
            const pdf = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: '<span></span>',
                footerTemplate: `<div style="width:100%;font-size:7.5px;color:#6b7280;padding:0 10mm;display:flex;justify-content:space-between;"><span>${footerNote}</span><span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span></div>`,
                margin: { top: '12mm', right: '10mm', bottom: '15mm', left: '10mm' }
            });

            logger.info('Daily student lesson attendance PDF exported', {
                module: 'lesson-attendance',
                feature: 'daily-student-report',
                user_id: actorUserId,
                attendance_date: data.attendance_date,
                class_id: data.applied_filters.class_id,
                export_format: 'pdf',
                record_count: data.students.length
            });

            return { buffer: Buffer.from(pdf), filename };
        } finally {
            await browser.close();
        }
    }
}

module.exports = new LessonAttendanceDailyExportService();
