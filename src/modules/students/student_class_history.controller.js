const studentClassHistoryService = require('./student_class_history.service');

exports.getAllClassHistories = async (req, res) => {
    try {
        const filters = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
            academic_year_id: req.query.academic_year_id,
            grade_id: req.query.grade_id,
            class_id: req.query.class_id
        };
        const result = await studentClassHistoryService.getAll(filters);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, error_code: 'INTERNAL_ERROR' });
    }
};

exports.getClassHistoryById = async (req, res) => {
    try {
        const history = await studentClassHistoryService.getById(req.params.id);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message, error_code: 'NOT_FOUND' });
    }
};

exports.createClassHistory = async (req, res) => {
    try {
        const data = { ...req.body, assigned_by: req.user.id };
        const history = await studentClassHistoryService.create(data);
        res.status(201).json({ success: true, data: history, message: 'Riwayat kelas berhasil ditambahkan' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error_code: 'BAD_REQUEST' });
    }
};

exports.updateClassHistory = async (req, res) => {
    try {
        const data = { ...req.body };
        const history = await studentClassHistoryService.update(req.params.id, data);
        res.status(200).json({ success: true, data: history, message: 'Riwayat kelas berhasil diperbarui' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error_code: 'BAD_REQUEST' });
    }
};

exports.deleteClassHistory = async (req, res) => {
    try {
        await studentClassHistoryService.delete(req.params.id);
        res.status(200).json({ success: true, message: 'Riwayat kelas berhasil dihapus' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error_code: 'BAD_REQUEST' });
    }
};
