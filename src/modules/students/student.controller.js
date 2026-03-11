const studentService = require('./student.service');

exports.findAll = async (req, res, next) => {
    try {
        const result = await studentService.findAll(req.query);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const student = await studentService.findById(req.params.id);
        res.json({
            success: true,
            data: student
        });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const student = await studentService.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: student
        });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const student = await studentService.update(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Student updated successfully',
            data: student
        });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        await studentService.delete(req.params.id);
        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.downloadTemplate = async (req, res, next) => {
    try {
        await studentService.generateTemplate(res);
    } catch (error) {
        next(error);
    }
};

exports.exportExcel = async (req, res, next) => {
    try {
        await studentService.exportExcel(res, req.query);
    } catch (error) {
        next(error);
    }
};

exports.importExcel = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
        }

        // Use the buffer directly
        const result = await studentService.importExcel(req.file.buffer, req.user?.id);

        res.json({
            success: true,
            message: `Berhasil import ${result.importedCount} data siswa`,
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
