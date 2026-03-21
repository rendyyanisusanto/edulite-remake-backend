const classSetupService = require('./class_setup.service');

exports.getSummary = async (req, res) => {
    try {
        const { academic_year_id, grade_id } = req.query;
        if (!academic_year_id) {
            return res.status(400).json({ success: false, message: 'academic_year_id wajib diisi', error_code: 'BAD_REQUEST' });
        }
        const data = await classSetupService.getSummary(academic_year_id, grade_id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, error_code: 'INTERNAL_ERROR' });
    }
};

exports.getClasses = async (req, res) => {
    try {
        const { academic_year_id, grade_id } = req.query;
        if (!academic_year_id) {
            return res.status(400).json({ success: false, message: 'academic_year_id wajib diisi', error_code: 'BAD_REQUEST' });
        }
        const data = await classSetupService.getClasses(academic_year_id, grade_id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, error_code: 'INTERNAL_ERROR' });
    }
};

exports.getUnassignedStudents = async (req, res) => {
    try {
        const { academic_year_id, search, page, limit, gender } = req.query;
        if (!academic_year_id) {
            return res.status(400).json({ success: false, message: 'academic_year_id wajib diisi', error_code: 'BAD_REQUEST' });
        }
        const data = await classSetupService.getUnassignedStudents({ academic_year_id, search, page, limit, gender });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, error_code: 'INTERNAL_ERROR' });
    }
};

exports.bulkAssign = async (req, res) => {
    try {
        const body = { ...req.body, assigned_by: req.user.id };
        const result = await classSetupService.bulkAssign(body);
        res.status(201).json({ success: true, data: result, message: result.message });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error_code: 'BAD_REQUEST' });
    }
};

exports.bulkMove = async (req, res) => {
    try {
        const body = { ...req.body, assigned_by: req.user.id };
        const result = await classSetupService.bulkMove(body);
        res.status(200).json({ success: true, data: result, message: result.message });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error_code: 'BAD_REQUEST' });
    }
};

exports.removeAssignment = async (req, res) => {
    try {
        await classSetupService.removeAssignment(req.params.history_id);
        res.status(200).json({ success: true, message: 'Penempatan kelas berhasil dihapus' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error_code: 'BAD_REQUEST' });
    }
};
