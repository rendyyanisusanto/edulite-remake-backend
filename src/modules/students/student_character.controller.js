const studentCharacterService = require('./student_character.service');

exports.getCharacterReport = async (req, res, next) => {
    try {
        const studentId = req.params.id;
        const academicYearId = req.query.academic_year_id || null;
        const reportData = await studentCharacterService.getCharacterReportData(studentId, academicYearId);
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
        const academicYearId = req.query.academic_year_id || null;

        // 1. Fetch JSON Data
        const reportData = await studentCharacterService.getCharacterReportData(studentId, academicYearId);

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

const parseBulkItems = (body) => {
    const items = Array.isArray(body.items) ? body.items.filter(i => i && i.student_id) : [];
    if (!items.length) {
        const err = new Error('Daftar siswa tidak boleh kosong');
        err.statusCode = 400;
        throw err;
    }
    if (items.length > 200) {
        const err = new Error('Maksimal 200 siswa per permintaan');
        err.statusCode = 400;
        throw err;
    }
    return items;
};

exports.getBulkCharacterReport = async (req, res, next) => {
    try {
        const items = parseBulkItems(req.body);
        const data = await studentCharacterService.getBulkReportData(items, req.body.academic_year_id || null);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.exportBulkCharacterReportPdf = async (req, res, next) => {
    try {
        const items = parseBulkItems(req.body);
        const entries = await studentCharacterService.getBulkReportData(items, req.body.academic_year_id || null);
        const pdfBuffer = await studentCharacterService.generateMultiPdfBuffer(entries);
        const className = String(req.body.class_name || 'Kelas').replace(/[^\w\s-]/g, '');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Rapor Karakter - ${className}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};
