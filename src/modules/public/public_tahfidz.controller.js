const { TahfidzKiosk, Class, StudentTahfidzAttendance, Student } = require('../../models');
const { Op } = require('sequelize');
const tahfidzAttendanceService = require('../tahfidz-attendance/tahfidz_attendance.service');

class PublicTahfidzController {
    async getKioskData(req, res) {
        try {
            const { token } = req.params;
            
            // Validate token
            const kiosk = await TahfidzKiosk.findOne({
                where: { token, is_active: true },
                include: [
                    {
                        model: Class,
                        as: 'class_info',
                        attributes: ['id', 'name']
                    }
                ]
            });

            if (!kiosk) {
                return res.status(404).json({ success: false, message: 'Kiosk tidak tersedia atau token tidak valid.' });
            }

            // Get students for this class today
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD local time ideally, but this is simple UTC date. To be precise with timezone, better to use moment or just local date string if timezone is configured.
            // Let's use simple string date for today.
            const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD

            const students = await tahfidzAttendanceService.getAttendanceByClass(kiosk.class_id, dateStr);

            res.status(200).json({
                success: true,
                data: {
                    class_id: kiosk.class_id,
                    class_name: kiosk.class_info.name,
                    date: dateStr,
                    students: students
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem.' });
        }
    }

    async saveAttendance(req, res) {
        try {
            const { token } = req.params;
            const { attendance_date, students } = req.body;

            // Validate token
            const kiosk = await TahfidzKiosk.findOne({
                where: { token, is_active: true }
            });

            if (!kiosk) {
                return res.status(404).json({ success: false, message: 'Kiosk tidak tersedia atau token tidak valid.' });
            }

            if (!attendance_date || !students || !Array.isArray(students)) {
                return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
            }

            // We mock user for bulkUpsertAttendance as it expects a user object for created_by
            const mockUser = { name: 'KIOSK' };

            const data = {
                date: attendance_date,
                class_id: kiosk.class_id, // Force class_id from kiosk, ignoring any class_id from frontend
                students: students
            };

            const result = await tahfidzAttendanceService.bulkUpsertAttendance(data, mockUser);
            
            res.status(200).json(result);
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, message: 'Data absensi sudah ada dan terjadi konflik.' });
            }
            res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menyimpan.' });
        }
    }
}

module.exports = new PublicTahfidzController();
