const { StudentTahfidzAttendance, Student, Class, sequelize } = require('../../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

class TahfidzAttendanceService {
    /**
     * Get students by class with their tahfidz attendance for a specific date
     */
    async getAttendanceByClass(classId, date) {
        // Find all students in this class
        // Need to check student_class_history or directly from Student if class_id is in Student
        // Looking at the convention in student_attendance, students are fetched and then attendance is merged or left joined.
        // Get active academic year
        const activeAcademicYear = await sequelize.models.AcademicYear.findOne({
            where: { is_active: true }
        });

        if (!activeAcademicYear) {
            throw new Error('Tidak ada tahun ajaran aktif');
        }

        // Let's get the students first
        const students = await Student.findAll({
            where: { student_status: 'ACTIVE' },
            include: [
                {
                    model: sequelize.models.StudentClassHistory,
                    as: 'class_history',
                    where: { 
                        class_id: classId,
                        academic_year_id: activeAcademicYear.id
                    },
                    required: true
                }
            ],
            order: [['full_name', 'ASC']]
        });

        const studentIds = students.map(s => s.id);

        // Get their attendance
        const attendances = await StudentTahfidzAttendance.findAll({
            where: {
                class_id: classId,
                attendance_date: date,
                student_id: {
                    [Op.in]: studentIds
                }
            }
        });

        // Map them together
        const attendanceMap = {};
        attendances.forEach(a => {
            attendanceMap[a.student_id] = a;
        });

        return students.map(student => {
            const att = attendanceMap[student.id];
            return {
                student_id: student.id,
                nis: student.nis,
                nisn: student.nisn,
                name: student.full_name,
                status: att ? att.status : 'present', // default to present if not set
                notes: att ? att.notes : '',
                id: att ? att.id : null // attendance record id if exists
            };
        });
    }

    /**
     * Bulk upsert tahfidz attendance
     */
    async bulkUpsertAttendance(data, user) {
        const { date, class_id, students } = data;
        const transaction = await sequelize.transaction();

        try {
            const upsertData = students.map(s => ({
                id: s.id || undefined, // undefined will let Sequelize auto-generate UUID if not exists
                student_id: s.student_id,
                class_id: class_id,
                attendance_date: date,
                status: s.status,
                notes: s.notes,
                created_by: user?.name || null,
                updated_by: user?.name || null
            }));

            // In Sequelize, bulkCreate with updateOnDuplicate does an UPSERT
            // We need to specify the fields to update
            await StudentTahfidzAttendance.bulkCreate(upsertData, {
                updateOnDuplicate: ['status', 'notes', 'updated_by', 'updated_at'],
                transaction
            });

            await transaction.commit();
            return { success: true, message: 'Attendance saved successfully' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get Recap data
     */
    async getRecap(filters) {
        const { start_date, end_date, class_id, student_id, status } = filters;
        
        const where = {};
        if (start_date && end_date) {
            where.attendance_date = { [Op.between]: [start_date, end_date] };
        } else if (start_date) {
            where.attendance_date = { [Op.gte]: start_date };
        }
        if (class_id) where.class_id = class_id;
        if (student_id) where.student_id = student_id;
        if (status) where.status = status;

        const attendances = await StudentTahfidzAttendance.findAll({
            where,
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'nis', 'full_name']
                },
                {
                    model: Class,
                    as: 'class_info',
                    attributes: ['id', 'name']
                }
            ],
            order: [['attendance_date', 'DESC'], ['student', 'full_name', 'ASC']]
        });

        // Calculate summary
        const summary = {
            present: 0,
            permission: 0,
            sick: 0,
            absent: 0
        };

        attendances.forEach(a => {
            if (summary[a.status] !== undefined) {
                summary[a.status]++;
            }
        });

        return {
            data: attendances,
            summary
        };
    }

    /**
     * Get recap for a single student
     */
    async getStudentRecap(studentId, filters) {
        return this.getRecap({ ...filters, student_id: studentId });
    }

    /**
     * Download import template for a specific class
     */
    async downloadTemplate(classId, res) {
        // Get active academic year
        const activeAcademicYear = await sequelize.models.AcademicYear.findOne({
            where: { is_active: true }
        });

        if (!activeAcademicYear) {
            throw new Error('Tidak ada tahun ajaran aktif');
        }

        const classInfo = await Class.findByPk(classId);
        if (!classInfo) {
            throw new Error('Kelas tidak ditemukan');
        }

        // Get students in this class
        const students = await Student.findAll({
            where: { student_status: 'ACTIVE' },
            include: [
                {
                    model: sequelize.models.StudentClassHistory,
                    as: 'class_history',
                    where: { 
                        class_id: classId,
                        academic_year_id: activeAcademicYear.id
                    },
                    required: true
                }
            ],
            order: [['full_name', 'ASC']]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Template - ${classInfo.name.replace(/[^a-zA-Z0-9 ]/g, '')}`);

        // Add headers
        worksheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'ID Siswa (Jangan Diubah)', key: 'student_id', width: 25 },
            { header: 'NIS', key: 'nis', width: 15 },
            { header: 'Nama Siswa', key: 'name', width: 35 },
            { header: 'Status (H/I/S/A)', key: 'status', width: 15 },
            { header: 'Keterangan', key: 'notes', width: 30 }
        ];

        // Style headers
        worksheet.getRow(1).font = { bold: true };
        
        // Hide student_id column to prevent modification but keep it for mapping
        worksheet.getColumn(2).hidden = true;

        // Add data
        students.forEach((student, index) => {
            worksheet.addRow({
                no: index + 1,
                student_id: student.id,
                nis: student.nis,
                name: student.full_name,
                status: 'H',
                notes: ''
            });
        });

        // Data Validation for Status
        for (let i = 2; i <= students.length + 1; i++) {
            worksheet.getCell(`E${i}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"H,I,S,A"']
            };
        }

        // Add info row
        const startInfoRow = students.length + 3;
        worksheet.getRow(startInfoRow).values = ['CATATAN:'];
        worksheet.getRow(startInfoRow).font = { bold: true };
        worksheet.getRow(startInfoRow + 1).values = ['- H = Hadir, I = Izin, S = Sakit, A = Alpa'];
        worksheet.getRow(startInfoRow + 2).values = ['- Jangan mengubah ID Siswa'];

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=template_tahfidz_${classInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);

        await workbook.xlsx.write(res);
    }

    /**
     * Import attendance from uploaded file
     */
    async importAttendance(file, params, user) {
        const { date, class_id } = params;
        
        if (!date || !class_id) {
            throw new Error('Tanggal dan Kelas wajib diisi');
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);

        const worksheet = workbook.worksheets[0];
        
        const allRows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            allRows.push({ row, rowNumber });
        });

        const studentsData = [];
        
        // Process rows
        for (const { row } of allRows) {
            const rawStudentId = row.getCell(2).value;
            
            // Stop if student_id is empty (reached info rows)
            if (!rawStudentId || String(rawStudentId).startsWith('-') || rawStudentId === 'CATATAN:') {
                break;
            }

            // Ensure student_id is integer
            const student_id = parseInt(rawStudentId, 10);
            if (isNaN(student_id)) break;

            let statusRaw = row.getCell(5).value;
            if (statusRaw) statusRaw = statusRaw.toString().trim().toUpperCase();
            else statusRaw = 'H';
            
            let status = 'present';
            switch (statusRaw) {
                case 'I': status = 'permission'; break;
                case 'S': status = 'sick'; break;
                case 'A': status = 'absent'; break;
                case 'H':
                default:
                    status = 'present'; break;
            }

            const notes = row.getCell(6).value?.toString() || '';

            studentsData.push({
                student_id,
                status,
                notes
            });
        }
        
        if (studentsData.length === 0) {
            throw new Error('Tidak ada data siswa yang valid di dalam file Excel. Pastikan file yang diunggah adalah template yang sudah diunduh dari sistem.');
        }

        // Call bulk upsert
        return this.bulkUpsertAttendance({
            date,
            class_id,
            students: studentsData
        }, user);
    }
}

module.exports = new TahfidzAttendanceService();
