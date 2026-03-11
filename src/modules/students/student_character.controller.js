const studentCharacterService = require('./student_character.service');

exports.getCharacterReport = async (req, res, next) => {
    try {
        const studentId = req.params.id;
        const reportData = await studentCharacterService.getCharacterReportData(studentId);
        res.json({
            success: true,
            data: reportData
        });
    } catch (error) {
        next(error);
    }
};

exports.exportCharacterReportPdf = async (req, res, next) => {
    try {
        const studentId = req.params.id;
        const notes = req.query.notes || '';

        // 1. Fetch JSON Data
        const reportData = await studentCharacterService.getCharacterReportData(studentId);

        // 2. Generate PDF stream/buffer
        const pdfBuffer = await studentCharacterService.generatePdfBuffer(reportData, notes);

        // Fetch active academic year for filename
        const { AcademicYear } = require('../../models');
        const activeYear = await AcademicYear.findOne({ where: { is_active: true } });
        const yearStr = activeYear ? activeYear.name.replace(/\//g, '-') : 'Tahun Ajaran Aktif';

        // 3. Set headers for file download
        const studentName = reportData.student.name || studentId;
        const filename = `Rapor Karakter Siswa - ${studentName} - ${yearStr}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // 4. Send buffer
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};
