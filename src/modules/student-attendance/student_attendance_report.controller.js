const studentAttendanceReportService = require('./student_attendance_report.service');

exports.getRecapMatrix = async (req, res, next) => {
    try {
        const result = await studentAttendanceReportService.getRecapMatrix(req.query);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};
