const studentAttendanceService = require('./student_attendance.service');

exports.getList = async (req, res, next) => {
    try {
        const result = await studentAttendanceService.findAll(req.query);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const attendance = await studentAttendanceService.findById(req.params.id);
        res.json({
            success: true,
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

exports.getSummary = async (req, res, next) => {
    try {
        const summary = await studentAttendanceService.getSummary(req.query);
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const attendance = await studentAttendanceService.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Attendance created successfully',
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const attendance = await studentAttendanceService.update(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Attendance updated successfully',
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const result = await studentAttendanceService.delete(req.params.id);
        res.json({
            success: true,
            message: 'Attendance deleted successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.upsert = async (req, res, next) => {
    try {
        const attendance = await studentAttendanceService.upsert(req.body);
        res.status(201).json({
            success: true,
            message: 'Attendance upserted successfully',
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

exports.bulkUpsert = async (req, res, next) => {
    try {
        const result = await studentAttendanceService.bulkUpsert(req.body);
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

exports.getStudentsByClass = async (req, res, next) => {
    try {
        const result = await studentAttendanceService.getStudentsByClass(req.params.classId, req.query);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.validateImport = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const result = await studentAttendanceService.validateImport(req.file, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.importAttendance = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const result = await studentAttendanceService.importAttendance(req.file, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.downloadTemplate = async (req, res, next) => {
    try {
        await studentAttendanceService.downloadTemplate(res);
    } catch (error) {
        next(error);
    }
};
