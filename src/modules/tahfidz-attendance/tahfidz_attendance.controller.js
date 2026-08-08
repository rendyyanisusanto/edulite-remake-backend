const tahfidzAttendanceService = require('./tahfidz_attendance.service');
const { Class } = require('../../models');

class TahfidzAttendanceController {
    async getClasses(req, res) {
        try {
            // Ideally, filter by teacher's classes if it's a teacher role. 
            // For now, returning all active classes.
            const classes = await Class.findAll({
                order: [['name', 'ASC']],
                attributes: ['id', 'name']
            });
            res.status(200).json({ success: true, data: classes });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getAttendanceByClass(req, res) {
        try {
            const { class_id, date } = req.query;
            if (!class_id || !date) {
                return res.status(400).json({ success: false, message: 'class_id and date are required' });
            }
            
            const data = await tahfidzAttendanceService.getAttendanceByClass(class_id, date);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async bulkUpsertAttendance(req, res) {
        try {
            const result = await tahfidzAttendanceService.bulkUpsertAttendance(req.body, req.user);
            res.status(200).json(result);
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, message: 'Data absensi sudah ada dan terjadi konflik.' });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getRecap(req, res) {
        try {
            const result = await tahfidzAttendanceService.getRecap(req.query);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getStudentRecap(req, res) {
        try {
            const { id } = req.params;
            const result = await tahfidzAttendanceService.getStudentRecap(id, req.query);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async downloadTemplate(req, res) {
        try {
            const { class_id } = req.query;
            if (!class_id) {
                return res.status(400).json({ success: false, message: 'class_id is required' });
            }
            await tahfidzAttendanceService.downloadTemplate(class_id, res);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async importAttendance(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'File template absensi tidak ditemukan' });
            }
            
            const result = await tahfidzAttendanceService.importAttendance(req.file, req.body, req.user);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new TahfidzAttendanceController();
