'use strict';

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const db = require('../../models');
const { formatTanggalIndo, formatHariIndo, formatWaktu, isSameDate } = require('./permission_letter_pdf.helper');

// ─── Constants ────────────────────────────────────────────────────────────────
const HEADER_PATH = path.join(__dirname, '../../../public/header.png');

// A4 in points (1 inch = 72pt)
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const ML = 65;                  // margin left
const MR = 65;                  // margin right
const MT = 45;                  // margin top
const MB = 50;                  // margin bottom
const CW = PAGE_W - ML - MR;   // content width ≈ 465

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function fetchPrintData(id) {
    const {
        PermissionLetter, PermissionLetterStudent,
        Teacher, Student, User,
        StudentClassHistory, Class
    } = db;

    const letter = await PermissionLetter.findByPk(id, {
        include: [
            {
                model: Teacher,
                as: 'teacher',
                attributes: ['id', 'full_name', 'nip', 'position']
            },
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: User, as: 'approver', attributes: ['id', 'name'] },
            {
                model: PermissionLetterStudent,
                as: 'students',
                include: [
                    {
                        model: Student,
                        as: 'student',
                        attributes: ['id', 'full_name', 'nis', 'nisn'],
                        include: [
                            {
                                model: StudentClassHistory,
                                as: 'class_history',
                                include: [
                                    {
                                        model: Class,
                                        as: 'class_info',
                                        attributes: ['id', 'name']
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    });

    if (!letter) throw new Error('Surat izin tidak ditemukan');
    return letter;
}

// ─── PDF Generator ────────────────────────────────────────────────────────────

function generatePdf(letter) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: MT, bottom: MB, left: ML, right: MR },
            autoFirstPage: false,
            bufferPages: true
        });

        const buffers = [];
        doc.on('data', chunk => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Page 1 – Official Letter
        doc.addPage();
        _renderPage1(doc, letter);

        // Page 2 – Student List Attachment
        doc.addPage();
        _renderPage2(doc, letter);

        doc.end();
    });
}

// ─── Shared: Draw letterhead ──────────────────────────────────────────────────

function _drawHeader(doc) {
    if (fs.existsSync(HEADER_PATH)) {
        // Flush to top of page, fit within content margins (no full-page stretch)
        doc.image(HEADER_PATH, ML, 0, { width: CW });
    }
    // No dividing line — generous spacing so body content doesn't collide with header
    return doc.y + 70;
}

// ─── Page 1: Official Letter ──────────────────────────────────────────────────

function _renderPage1(doc, letter) {
    const FS = 10;
    const LH = 14;   // line height for 10pt

    let y = _drawHeader(doc);

    const companionName = letter.companion_name || letter.teacher?.full_name || '-';

    // Resolve letter date
    const rawDate = letter.created_at
        ? (typeof letter.created_at === 'string'
            ? letter.created_at.slice(0, 10)
            : letter.created_at.toISOString().slice(0, 10))
        : new Date().toISOString().slice(0, 10);
    const letterDate = formatTanggalIndo(rawDate);
    const city = 'Malang';

    // ── Nomor / Lampiran / Hal (left) + City & Date (top-right, same Y) ──────
    const lblW   = 65;
    const colonW = 12;
    const valX   = ML + lblW + colonW;
    const valW   = CW - lblW - colonW;

    const metaRows = [
        ['Nomor',    letter.code || '-'],
        ['Lampiran', '1 (satu) lembar'],
        ['Hal',      'Permohonan Izin Siswa']
    ];

    // City + Date pinned to top-right at the same Y as the first meta row
    const dateBlockW = 180;
    const dateBlockX = PAGE_W - MR - dateBlockW;
    doc.font('Helvetica').fontSize(FS)
        .text(`${city}, ${letterDate}`, dateBlockX, y, { width: dateBlockW, align: 'right', lineBreak: false });

    metaRows.forEach(([lbl, val]) => {
        doc.font('Helvetica').fontSize(FS)
            .text(lbl, ML, y, { width: lblW, lineBreak: false });
        doc.font('Helvetica').fontSize(FS)
            .text(':', ML + lblW, y, { width: colonW, lineBreak: false });
        doc.font('Helvetica').fontSize(FS)
            .text(val, valX, y, { width: valW, lineBreak: false });
        y += LH;
    });

    y += 10;

    // ── Recipient ─────────────────────────────────────────────────────────────
    doc.font('Helvetica').fontSize(FS).text('Yth.', ML, y, { lineBreak: false });
    y += LH;
    doc.font('Helvetica').fontSize(FS).text(letter.purpose || 'Kepala Dinas Pendidikan', ML, y, { width: CW, lineBreak: false });
    y += LH;
    doc.font('Helvetica').fontSize(FS).text('di Tempat', ML, y, { lineBreak: false });
    y += LH + 12;

    // ── Opening greeting ──────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(FS)
        .text("Assalamu'alaikum Warahmatullahi Wabarokatuh.", ML, y, { width: CW, lineBreak: false });
    y += LH + 6;

    // ── Body paragraph 1 (FIXED – do not change) ──────────────────────────────
    const body1 = "Salam silaturrahim kami haturkan, teriring do'a semoga Bapak/Ibu senantiasa mendapatkan rahmat, " +
        "hidayah, inayah serta ma'unnah Allah SWT, sehingga dalam menjalankan aktifitas sehari-hari dapat " +
        "terlaksana dengan sebaik-baiknya, Amin.";
    doc.font('Helvetica').fontSize(FS)
        .text(body1, ML, y, { width: CW, align: 'justify', lineGap: 2 });
    y = doc.y + 8;

    // ── Body paragraph 2 (FIXED – only activity_name is dynamic) ─────────────
    const body2 = `Sehubungan dengan adanya ${letter.activity_name || '[kegiatan]'}, maka kami bermaksud ` +
        `memohonkan ijin beberapa siswa (nama terlampir) untuk mengikuti kegiatan tersebut pada :`;
    doc.font('Helvetica').fontSize(FS)
        .text(body2, ML, y, { width: CW, align: 'justify', lineGap: 2 });
    y = doc.y + 10;

    // ── Activity details ──────────────────────────────────────────────────────
    const dIndent = ML + 20;
    const dLblW   = 60;
    const dColonW = 12;
    const dValX   = dIndent + dLblW + dColonW;
    const dValW   = CW - 20 - dLblW - dColonW;

    const startDate = letter.start_date;
    const endDate   = letter.end_date;
    const sameDay   = !endDate || isSameDate(startDate, endDate);

    const tanggalStr = sameDay
        ? formatTanggalIndo(startDate)
        : `${formatTanggalIndo(startDate)} s/d ${formatTanggalIndo(endDate)}`;

    const hariStr = formatHariIndo(startDate);

    const waktuStr = letter.start_time && letter.end_time
        ? `${formatWaktu(letter.start_time)} - ${formatWaktu(letter.end_time)}`
        : (letter.start_time ? formatWaktu(letter.start_time) : '-');

    const details = [
        ['Hari',    hariStr],
        ['Tanggal', tanggalStr],
        ['Waktu',   waktuStr],
        ['Tempat',  letter.location || '-']
    ];

    details.forEach(([lbl, val]) => {
        doc.font('Helvetica').fontSize(FS)
            .text(lbl, dIndent, y, { width: dLblW, lineBreak: false });
        doc.font('Helvetica').fontSize(FS)
            .text(':', dIndent + dLblW, y, { width: dColonW, lineBreak: false });
        doc.font('Helvetica').fontSize(FS)
            .text(val, dValX, y, { width: dValW, lineBreak: false });
        y += LH;
    });

    y += 10;

    // ── Closing paragraph (FIXED – do not change) ─────────────────────────────
    const closing1 = "Demikian surat permohonan ini kami sampaikan, atas perhatian dan ijin yang diberikan kami " +
        "sampaikan terima kasih.";
    doc.font('Helvetica').fontSize(FS)
        .text(closing1, ML, y, { width: CW, align: 'justify', lineGap: 2 });
    y = doc.y + 6;

    doc.font('Helvetica-Oblique').fontSize(FS)
        .text("Wallahul Mawafiq illa aqwamith thariq", ML, y, { width: CW, lineBreak: false });
    y += LH + 4;

    doc.font('Helvetica-Bold').fontSize(FS)
        .text("Wassalamu'alaikum Warahmatullahi Wabarokatuh.", ML, y, { width: CW, lineBreak: false });
    y += LH + 20;

    // ── Signature block (right) ───────────────────────────────────────────────
    const sigW = 165;
    const sigX = PAGE_W - MR - sigW;

    doc.font('Helvetica').fontSize(FS)
        .text(`${city}, ${letterDate}`, sigX, y, { width: sigW, align: 'center', lineBreak: false });
    y += LH;
    doc.font('Helvetica').fontSize(FS)
        .text('Hormat kami,', sigX, y, { width: sigW, align: 'center', lineBreak: false });
    y += LH;
    doc.font('Helvetica').fontSize(FS)
        .text('Kepala Sekolah', sigX, y, { width: sigW, align: 'center', lineBreak: false });

    // Space for physical signature
    const signerY = y + 55;
    // Use approver name if set and not a system account, otherwise fall back to school principal
    const approverName = letter.approver?.name;
    const signerName = (approverName && approverName.toLowerCase() !== 'superadmin')
        ? approverName
        : 'Avi Hendratmoko, S.Kom';
    doc.font('Helvetica-Bold').fontSize(FS)
        .text(signerName, sigX, signerY, { width: sigW, align: 'center', lineBreak: false });

    // ── Tembusan (left) ───────────────────────────────────────────────────────
    const tY = y + 20;
    doc.font('Helvetica').fontSize(FS).text('Tembusan:', ML, tY, { lineBreak: false });
    doc.font('Helvetica').fontSize(FS).text('1. Kepala Sekolah', ML, tY + LH, { lineBreak: false });
    doc.font('Helvetica').fontSize(FS).text('2. Wali Kelas', ML, tY + LH * 2, { lineBreak: false });
    doc.font('Helvetica').fontSize(FS).text('3. Arsip', ML, tY + LH * 3, { lineBreak: false });
}

// ─── Page 2: Student List Attachment ─────────────────────────────────────────

function _renderPage2(doc, letter) {
    const FS     = 10;
    const LH     = 14;
    const ROW_H  = 20;
    const HDR_H  = 22;

    let y = _drawHeader(doc);

    const companionName = letter.companion_name || letter.teacher?.full_name || '-';
    const students = letter.students || [];

    // ── Attachment title ──────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(12)
        .text('LAMPIRAN', ML, y, { width: CW, align: 'center', lineBreak: false });
    y += 16;

    doc.font('Helvetica-Bold').fontSize(12)
        .text('DAFTAR NAMA SISWA', ML, y, { width: CW, align: 'center', lineBreak: false });
    y += 16;

    doc.font('Helvetica').fontSize(FS)
        .text(`Nomor: ${letter.code || '-'}`, ML, y, { width: CW, align: 'center', lineBreak: false });
    y += 20;

    // ── Table ─────────────────────────────────────────────────────────────────
    // Column widths: No | Nama Siswa | Kelas | Pendamping
    const cols = [
        { label: 'No',          w: 28,  align: 'center' },
        { label: 'Nama Siswa',  w: 195, align: 'left'   },
        { label: 'Kelas',       w: 95,  align: 'center' },
        { label: 'Pendamping',  w: 147, align: 'left'   }
    ];
    // Total = 28+195+95+147 = 465 = CW ✓

    const drawTableHeader = (startY) => {
        let x = ML;
        // Header background
        doc.rect(ML, startY, CW, HDR_H).fillColor('#e8e8e8').fill();
        // Header borders
        doc.rect(ML, startY, CW, HDR_H).strokeColor('#888888').lineWidth(0.5).stroke();

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
        cols.forEach(col => {
            doc.text(col.label, x + 4, startY + 7, {
                width: col.w - 8,
                align: col.align,
                lineBreak: false
            });
            x += col.w;
        });
        return startY + HDR_H;
    };

    y = drawTableHeader(y);

    // Draw rows
    doc.font('Helvetica').fontSize(9).fillColor('#000000');

    students.forEach((ps, idx) => {
        // Multi-page: check overflow
        if (y + ROW_H > PAGE_H - MB) {
            doc.addPage();
            y = _drawHeader(doc);
            // Redraw table header on new page
            doc.font('Helvetica-Bold').fontSize(12)
                .text('LAMPIRAN (lanjutan)', ML, y, { width: CW, align: 'center', lineBreak: false });
            y += 18;
            y = drawTableHeader(y);
            doc.font('Helvetica').fontSize(9).fillColor('#000000');
        }

        const student = ps.student;

        // Get latest class from class_history (sort by created_at desc)
        const latestHistory = (student?.class_history || [])
            .slice()
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
        const className = latestHistory?.class_info?.name || '-';

        // Row background (alternating)
        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f7f7f7';
        doc.rect(ML, y, CW, ROW_H).fillColor(rowBg).fill();
        doc.rect(ML, y, CW, ROW_H).strokeColor('#cccccc').lineWidth(0.4).stroke();

        const rowData = [
            String(idx + 1),
            student?.full_name || '-',
            className,
            companionName
        ];

        let x = ML;
        doc.fillColor('#000000');
        rowData.forEach((val, i) => {
            doc.font('Helvetica').fontSize(9).text(
                val,
                x + 4,
                y + 6,
                { width: cols[i].w - 8, align: cols[i].align, lineBreak: false }
            );
            x += cols[i].w;
        });

        y += ROW_H;
    });

    // Bottom border of table
    doc.moveTo(ML, y).lineTo(ML + CW, y).strokeColor('#888888').lineWidth(0.5).stroke();
}

module.exports = { fetchPrintData, generatePdf };
