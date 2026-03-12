const { Student, Class, AcademicYear, AchievementResult, AchievementParticipant, Achievement, AchievementPointRule, StudentViolation, ViolationType, ViolationLevel } = require('../../models');
const PDFDocument = require('pdfkit');
const path = require('path');

class StudentCharacterService {

    // Helper to fetch student and base info
    async getStudentIdentity(studentId) {
        const student = await Student.findByPk(studentId, {
            include: [
                {
                    model: require('../../models').StudentClassHistory,
                    as: 'class_history',
                    required: false,
                    include: [
                        { model: Class, as: 'class_info', attributes: ['name'] }
                    ]
                }
            ]
        });
        if (!student) throw new Error('Student not found');
        return student;
    }

    async getCharacterReportData(studentId) {
        const student = await this.getStudentIdentity(studentId);

        // Fetch Achievements
        const achievementResults = await AchievementResult.findAll({
            include: [
                {
                    model: AchievementParticipant,
                    as: 'participant',
                    where: { student_id: studentId },
                    include: [
                        { model: Achievement, as: 'achievement' }
                    ]
                },
                {
                    model: AchievementPointRule,
                    as: 'point_rule'
                }
            ],
            order: [[{ model: AchievementParticipant, as: 'participant' }, { model: Achievement, as: 'achievement' }, 'event_date', 'DESC']]
        });

        const achievements = achievementResults.map(r => {
            const ach = r.participant && r.participant.achievement ? r.participant.achievement : {};
            const rule = r.point_rule;
            return {
                id: r.id,
                date: ach.event_date || '-',
                title: ach.title || '-',
                level: ach.level || '-',
                rank: r.rank || (rule ? rule.rank : '-'),
                points: parseInt(r.points || 0),
                organizer: ach.organizer || '-',
                location: ach.location || '-'
            };
        });

        const totalAchievementPoints = achievements.reduce((sum, item) => sum + item.points, 0);

        // Fetch Violations (Only approved)
        const violationsData = await StudentViolation.findAll({
            where: { student_id: studentId, status: 'approved' },
            include: [
                {
                    model: ViolationType,
                    as: 'type',
                    include: [{ model: ViolationLevel, as: 'level' }]
                }
            ],
            order: [['date', 'DESC']]
        });

        const violations = violationsData.map(v => {
            return {
                id: v.id,
                date: v.date,
                type: v.type ? v.type.name : '-',
                level: v.type && v.type.level ? v.type.level.name : '-',
                points: v.type ? parseInt(v.type.point || 0) : 0,
                location: v.location
            };
        });

        const totalViolationPoints = violations.reduce((sum, item) => sum + item.points, 0);

        const summary = {
            total_achievements: achievements.length,
            total_achievement_points: totalAchievementPoints,
            total_violations: violations.length,
            total_violation_points: totalViolationPoints,
            final_score: totalAchievementPoints - totalViolationPoints
        };

        const { AcademicYear } = require('../../models');
        const activeYear = await AcademicYear.findOne({ where: { is_active: true } });
        const yearStr = activeYear ? activeYear.name : '2023/2024';

        return {
            student: {
                id: student.id,
                name: student.full_name,
                nis: student.nis,
                class_name: student.class_history && student.class_history.length > 0 && student.class_history[0].class_info ? student.class_history[0].class_info.name : '-',
                photo: student.photo,
                active_academic_year: yearStr
            },
            summary,
            achievements,
            violations
        };
    }

    async generatePdfBuffer(reportData, customNotes = '') {
        return new Promise((resolve, reject) => {
            try {
                // Adjust margins for a neater look
                const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
                const buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                // Helper for drawing lines
                const drawLine = (y) => {
                    doc.strokeColor('#e5e7eb')
                        .lineWidth(1)
                        .moveTo(50, y)
                        .lineTo(545, y)
                        .stroke();
                };

                // Helper for drawing solid table headers
                const drawTableHeader = (y, height) => {
                    doc.fillColor('#f3f4f6')
                        .rect(50, y, 495, height)
                        .fill();
                    doc.fillColor('#374151');
                };

                try {
                    doc.image(path.join(process.cwd(), 'public/header.png'), 50, 0, { width: 495 });
                    doc.y = 90; // Setup general start below the image
                } catch (e) {
                    console.error("Header image not found, skipping.");
                    doc.y = 50;
                }

                doc.moveDown(2);
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827').text('RAPOR KARAKTER SISWA', { align: 'center' });
                doc.moveDown(1.5);

                // Helper for Drawing Custom Section Titles
                const drawSectionTitle = (title) => {
                    doc.moveDown(0.2);
                    const yTop = doc.y;

                    // Left-aligned short dotted lines
                    doc.strokeColor('#000000').lineWidth(1).dash(2, 2).moveTo(50, yTop).lineTo(250, yTop).stroke().undash();

                    doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827')
                        .text(title.toUpperCase(), 50, yTop + 4, { align: 'left' });

                    const yBot = doc.y + 2;
                    doc.strokeColor('#000000').lineWidth(1).dash(2, 2).moveTo(50, yBot).lineTo(250, yBot).stroke().undash();

                    doc.y = yBot + 10;
                };

                // --- IDENTITAS SISWA & RINGKASAN POIN (SIDE-BY-SIDE) ---
                doc.moveDown(0.2);
                const startInfoY = doc.y;

                // Title Identitas (Left)
                doc.strokeColor('#000000').lineWidth(1).dash(2, 2).moveTo(50, startInfoY).lineTo(250, startInfoY).stroke().undash();
                doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827')
                    .text('IDENTITAS SISWA', 50, startInfoY + 4, { align: 'left' });
                doc.strokeColor('#000000').lineWidth(1).dash(2, 2).moveTo(50, startInfoY + 16).lineTo(250, startInfoY + 16).stroke().undash();

                // Title Ringkasan (Right)
                doc.strokeColor('#000000').lineWidth(1).dash(2, 2).moveTo(295, startInfoY).lineTo(545, startInfoY).stroke().undash();
                doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827')
                    .text('RINGKASAN NILAI KARAKTER', 295, startInfoY + 4, { align: 'left' });
                doc.strokeColor('#000000').lineWidth(1).dash(2, 2).moveTo(295, startInfoY + 16).lineTo(545, startInfoY + 16).stroke().undash();

                // Content Y start
                const contentY = startInfoY + 25;
                doc.font('Helvetica').fontSize(10);

                // Left Content - Identitas
                doc.fillColor('#1f2937');
                doc.text('Nama Lengkap', 50, contentY);
                doc.text(`: ${reportData.student.name}`, 145, contentY);

                doc.text('NIS', 50, contentY + 15);
                doc.text(`: ${reportData.student.nis || '-'}`, 145, contentY + 15);

                doc.text('Kelas Saat Ini', 50, contentY + 30);
                doc.text(`: ${reportData.student.class_name || '-'}`, 145, contentY + 30);

                doc.text('Tahun Ajaran Aktif', 50, contentY + 45);
                doc.text(`: ${reportData.student.active_academic_year}`, 145, contentY + 45);

                // Right Content - Ringkasan Poin
                doc.text('Total Poin Prestasi', 295, contentY);
                doc.font('Helvetica-Bold').fillColor('#16a34a').text(`: +${reportData.summary.total_achievement_points}`, 430, contentY);

                doc.font('Helvetica').fillColor('#1f2937').text('Total Poin Pelanggaran', 295, contentY + 15);
                doc.font('Helvetica-Bold').fillColor('#dc2626').text(`: -${reportData.summary.total_violation_points}`, 430, contentY + 15);

                doc.font('Helvetica').fillColor('#1f2937').text('Nilai Karakter Akhir', 295, contentY + 30);
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#1d4ed8').text(`: ${reportData.summary.final_score}`, 430, contentY + 30);

                doc.y = contentY + 65;

                // --- DATA PRESTASI ---
                drawSectionTitle('RIWAYAT PRESTASI');
                doc.moveDown(0.5);

                if (reportData.achievements.length === 0) {
                    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#1f2937').text('Belum ada data prestasi tercatat.');
                    doc.moveDown(1);
                } else {
                    const thY = doc.y;
                    drawTableHeader(thY, 16);
                    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1f2937');
                    doc.text('Tanggal', 55, thY + 4);
                    doc.text('Nama / Judul Prestasi', 125, thY + 4);
                    doc.text('Tingkat', 355, thY + 4);
                    doc.text('Juara', 435, thY + 4);
                    doc.text('Poin', 505, thY + 4);
                    doc.y = thY + 20;

                    doc.font('Helvetica').fontSize(9).fillColor('#1f2937');
                    reportData.achievements.forEach((ach, index) => {
                        if (doc.y > 760) { doc.addPage(); doc.y = 50; }
                        const y = doc.y;
                        doc.text(ach.date ? new Date(ach.date).toLocaleDateString('id-ID') : '-', 55, y, { width: 65 });
                        doc.text(ach.title || '-', 125, y, { width: 220 });
                        doc.text(ach.level || '-', 355, y, { width: 75 });
                        doc.text(ach.rank || '-', 435, y, { width: 65 });
                        doc.text(`+${ach.points}`, 505, y, { width: 40 });
                        doc.moveDown(0.3);
                        drawLine(doc.y);
                        doc.moveDown(0.3);
                    });
                    doc.moveDown(1);
                }

                // --- DATA PELANGGARAN ---
                drawSectionTitle('RIWAYAT PELANGGARAN');
                doc.moveDown(0.5);

                if (reportData.violations.length === 0) {
                    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#1f2937').text('Tidak ada catatan pelanggaran.');
                    doc.moveDown(1);
                } else {
                    const thY2 = doc.y;
                    drawTableHeader(thY2, 16);
                    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1f2937');
                    doc.text('Tanggal', 55, thY2 + 4);
                    doc.text('Jenis Pelanggaran', 125, thY2 + 4);
                    doc.text('Level', 385, thY2 + 4);
                    doc.text('Poin', 505, thY2 + 4);
                    doc.y = thY2 + 20;

                    doc.font('Helvetica').fontSize(9).fillColor('#1f2937');
                    reportData.violations.forEach((v, index) => {
                        if (doc.y > 760) { doc.addPage(); doc.y = 50; }
                        const y = doc.y;
                        doc.text(v.date ? new Date(v.date).toLocaleDateString('id-ID') : '-', 55, y, { width: 65 });
                        doc.text(v.type || '-', 125, y, { width: 250 });
                        doc.text(v.level || '-', 385, y, { width: 115 });
                        doc.text(`-${v.points}`, 505, y, { width: 40 });
                        doc.moveDown(0.3);
                        drawLine(doc.y);
                        doc.moveDown(0.3);
                    });
                    doc.moveDown(1);
                }

                // --- CATATAN PEMBINAAN ---
                if (doc.y > 600) doc.addPage();

                drawSectionTitle('CATATAN PEMBINAAN');

                if (customNotes && customNotes.trim().length > 0) {
                    doc.font('Helvetica').fontSize(10).fillColor('#1f2937');
                    doc.text(customNotes, { align: 'justify', lineGap: 5 });
                } else {
                    doc.font('Helvetica').fontSize(10).fillColor('#1f2937');
                    for (let i = 0; i < 4; i++) {
                        doc.text('. '.repeat(55), { lineGap: 15 });
                    }
                }

                doc.moveDown(4);

                // --- SIGNATURE ---
                if (doc.y > 650) { doc.addPage(); doc.y = 50; }

                const currentDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                doc.font('Helvetica').fontSize(10).fillColor('#1f2937');

                doc.text(`Dicetak pada tanggal: ${currentDate}`, 350, doc.y);
                doc.moveDown(0.5);
                doc.text('Mengetahui,', 350, doc.y);
                doc.text('Wakil Kepala Bid. Kesiswaan', 350, doc.y);

                doc.moveDown(5);
                doc.font('Helvetica-Bold');
                doc.text('Rendy Yani Susanto, S.Pd', 350, doc.y);

                // Footer numbering
                let pages = doc.bufferedPageRange();
                for (let i = 0; i < pages.count; i++) {
                    doc.switchToPage(i);
                    doc.fontSize(8).fillColor('#9ca3af').text(
                        `Halaman ${i + 1} dari ${pages.count}`,
                        0,
                        doc.page.height - 30,
                        { align: 'center' }
                    );
                }

                doc.end();

            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = new StudentCharacterService();
