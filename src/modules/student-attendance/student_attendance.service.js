const { StudentAttendance, Student, Class, StudentClassHistory, User } = require('../../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

class StudentAttendanceService {
    /**
     * Get all attendance records with filters and pagination
     */
    async findAll(params = {}) {
        const {
            page = 1,
            limit = 20,
            keyword,
            date,
            class_id,
            attendance_status,
            input_method,
            startDate,
            endDate
        } = params;

        const where = {};
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Date filter
        if (date) {
            where.attendance_date = date;
        } else if (startDate && endDate) {
            where.attendance_date = {
                [Op.between]: [startDate, endDate]
            };
        }

        // Status filter
        if (attendance_status) {
            where.status = attendance_status;
        }

        // Input method filter
        if (input_method) {
            where.input_method = input_method;
        }

        // Keyword search (by student name or NIS)
        if (keyword) {
            where[Op.or] = [
                { '$student.full_name$': { [Op.like]: `%${keyword}%` } },
                { '$student.nis$': { [Op.like]: `%${keyword}%` } }
            ];
        }

        const { count, rows } = await StudentAttendance.findAndCountAll({
            where,
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'full_name', 'nis', 'photo'],
                    include: [
                        {
                            model: StudentClassHistory,
                            as: 'class_history',
                            required: false,
                            include: [
                                {
                                    model: Class,
                                    as: 'class_info',
                                    attributes: ['id', 'name']
                                }
                            ],
                            ...(class_id && { where: { class_id } }),
                            limit: 1,
                            order: [['created_at', 'DESC']]
                        }
                    ]
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: User,
                    as: 'updater',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['attendance_date', 'DESC'], ['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: offset,
            distinct: true
        });

        // Format response
        const attendances = rows.map(attendance => {
            const plain = attendance.get({ plain: true });

            // Get class info from class_history
            const classInfo = attendance.student?.class_history?.[0]?.class_info;

            return {
                ...plain,
                student: {
                    id: plain.student?.id,
                    full_name: plain.student?.full_name,
                    nis: plain.student?.nis,
                    photo: plain.student?.photo,
                    class_info: classInfo || null
                },
                created_by: plain.creator?.name || null,
                updated_by: plain.updater?.name || null
            };
        });

        return {
            attendances,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit)
        };
    }

    /**
     * Get attendance by ID
     */
    async findById(id) {
        const attendance = await StudentAttendance.findByPk(id, {
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'full_name', 'nis', 'photo', 'gender', 'address'],
                    include: [
                        {
                            model: StudentClassHistory,
                            as: 'class_history',
                            required: false,
                            include: [
                                {
                                    model: Class,
                                    as: 'class_info',
                                    attributes: ['id', 'name']
                                }
                            ],
                            limit: 1,
                            order: [['created_at', 'DESC']]
                        }
                    ]
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: User,
                    as: 'updater',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        if (!attendance) {
            throw new Error('Attendance not found');
        }

        const plain = attendance.get({ plain: true });
        const classInfo = attendance.student?.class_history?.[0]?.class_info;

        return {
            ...plain,
            student: {
                ...plain.student,
                class_info: classInfo || null
            },
            created_by: plain.creator?.name || null,
            updated_by: plain.updater?.name || null
        };
    }

    /**
     * Get summary statistics for cards
     */
    async getSummary(params = {}) {
        const { date, class_id } = params;

        // Build summary query
        let sql = `
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'HADIR' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN status = 'TERLAMBAT' THEN 1 ELSE 0 END) as terlambat,
                SUM(CASE WHEN status = 'IZIN' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN status = 'SAKIT' THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN status = 'ALPA' THEN 1 ELSE 0 END) as alpa
            FROM student_attendances sa
            ${date ? 'WHERE sa.attendance_date = :date' : ''}
        `;

        let replacements = { date };

        // Add class filter if provided
        if (class_id) {
            sql += ` AND sa.student_id IN (
                SELECT sch.student_id
                FROM student_class_history sch
                WHERE sch.class_id = :class_id
                ORDER BY sch.created_at DESC
                LIMIT 1
            )`;
            replacements.class_id = class_id;
        }

        const [summaryResult] = await StudentAttendance.sequelize.query(sql, {
            replacements,
            type: StudentAttendance.sequelize.QueryTypes.SELECT
        });

        return summaryResult[0];
    }

    /**
     * Create or update single attendance (upsert)
     */
    async upsert(data) {
        const { student_id, attendance_date, status, notes, input_method, clock_in_at, clock_out_at, late_minutes, created_by } = data;

        // Check if attendance exists for this student on this date
        const existing = await StudentAttendance.findOne({
            where: {
                student_id,
                attendance_date
            }
        });

        if (existing) {
            // Update existing
            return await this.update(existing.id, {
                status,
                notes,
                input_method,
                clock_in_at,
                clock_out_at,
                late_minutes,
                updated_by: created_by
            });
        } else {
            // Create new
            return await this.create({
                student_id,
                attendance_date,
                status,
                notes,
                input_method,
                clock_in_at,
                clock_out_at,
                late_minutes,
                created_by
            });
        }
    }

    /**
     * Create new attendance
     */
    async create(data) {
        const { student_id, attendance_date, status, notes, input_method, clock_in_at, clock_out_at, late_minutes, created_by } = data;

        // Check if attendance already exists
        const existing = await StudentAttendance.findOne({
            where: {
                student_id,
                attendance_date
            }
        });

        if (existing) {
            throw new Error('Attendance already exists for this student on this date. Use update instead.');
        }

        const attendance = await StudentAttendance.create({
            student_id,
            attendance_date,
            status: status || 'HADIR',
            notes: notes || null,
            input_method: input_method || 'manual',
            clock_in_at: clock_in_at || null,
            clock_out_at: clock_out_at || null,
            late_minutes: late_minutes || 0,
            created_by: created_by || null
        });

        return attendance;
    }

    /**
     * Update attendance
     */
    async update(id, data) {
        const attendance = await StudentAttendance.findByPk(id);
        if (!attendance) {
            throw new Error('Attendance not found');
        }

        const { status, notes, input_method, clock_in_at, clock_out_at, late_minutes, updated_by } = data;

        await attendance.update({
            status: status || attendance.status,
            notes: notes !== undefined ? notes : attendance.notes,
            input_method: input_method || attendance.input_method,
            clock_in_at: clock_in_at !== undefined ? clock_in_at : attendance.clock_in_at,
            clock_out_at: clock_out_at !== undefined ? clock_out_at : attendance.clock_out_at,
            late_minutes: late_minutes !== undefined ? late_minutes : attendance.late_minutes,
            updated_by: updated_by || null
        });

        return await this.findById(id);
    }

    /**
     * Delete attendance
     */
    async delete(id) {
        const attendance = await StudentAttendance.findByPk(id);
        if (!attendance) {
            throw new Error('Attendance not found');
        }

        await attendance.destroy();
        return { message: 'Attendance deleted successfully' };
    }

    /**
     * Bulk upsert attendance records for a class
     */
    async bulkUpsert(data) {
        const { date, class_id, attendances, created_by } = data;

        let createdCount = 0;
        let updatedCount = 0;
        const results = [];

        for (const item of attendances) {
            const { student_id, attendance_status, clock_in_at, notes, input_method, id } = item;

            try {
                if (id) {
                    // Update existing
                    const attendance = await StudentAttendance.findByPk(id);
                    if (attendance) {
                        await attendance.update({
                            status: attendance_status,
                            notes: notes || null,
                            clock_in_at: clock_in_at ? `${date}T${clock_in_at}:00Z` : null,
                            updated_by: created_by || null
                        });
                        updatedCount++;
                        results.push({ id, action: 'updated' });
                    }
                } else {
                    // Check if exists
                    const existing = await StudentAttendance.findOne({
                        where: {
                            student_id,
                            attendance_date: date
                        }
                    });

                    if (existing) {
                        // Update
                        await existing.update({
                            status: attendance_status,
                            notes: notes || null,
                            clock_in_at: clock_in_at ? `${date}T${clock_in_at}:00Z` : null,
                            updated_by: created_by || null
                        });
                        updatedCount++;
                        results.push({ student_id, action: 'updated' });
                    } else {
                        // Create
                        const newAttendance = await StudentAttendance.create({
                            student_id,
                            attendance_date: date,
                            status: attendance_status || 'HADIR',
                            notes: notes || null,
                            input_method: input_method || 'manual',
                            clock_in_at: clock_in_at ? `${date}T${clock_in_at}:00Z` : null,
                            created_by: created_by || null
                        });
                        createdCount++;
                        results.push({ student_id, action: 'created', id: newAttendance.id });
                    }
                }
            } catch (error) {
                results.push({ student_id, action: 'error', error: error.message });
            }
        }

        return {
            success: true,
            message: `${createdCount} attendance records created, ${updatedCount} updated`,
            created: createdCount,
            updated: updatedCount,
            total: createdCount + updatedCount,
            results
        };
    }

    /**
     * Get students by class for input form
     */
    async getStudentsByClass(classId, params = {}) {
        const { date } = params;

        // Get all students in this class
        const students = await Student.findAll({
            attributes: ['id', 'full_name', 'nis'],
            include: [
                {
                    model: StudentClassHistory,
                    as: 'class_history',
                    where: {
                        class_id: classId
                    },
                    required: true,
                    include: [
                        {
                            model: Class,
                            as: 'class_info',
                            attributes: ['id', 'name']
                        }
                    ],
                    limit: 1,
                    order: [['created_at', 'DESC']]
                }
            ],
            order: [['full_name', 'ASC']]
        });

        // Get existing attendance for these students on the specified date
        let existingAttendance = [];
        if (date) {
            const studentIds = students.map(s => s.id);
            if (studentIds.length > 0) {
                existingAttendance = await StudentAttendance.findAll({
                    where: {
                        student_id: studentIds,
                        attendance_date: date
                    },
                    include: [
                        {
                            model: User,
                            as: 'creator',
                            attributes: ['id', 'name']
                        }
                    ]
                });
            }
        }

        return {
            students: students.map(s => ({
                id: s.id,
                full_name: s.full_name,
                nis: s.nis,
                class_id: classId
            })),
            existing_attendance: existingAttendance.map(a => ({
                id: a.id,
                student_id: a.student_id,
                attendance_date: a.attendance_date,
                attendance_status: a.status,
                clock_in_at: a.clock_in_at,
                notes: a.notes,
                input_method: a.input_method,
                created_by: a.creator?.name || null
            })),
            class_id: classId,
            date
        };
    }

    /**
     * Validate import file
     */
    async validateImport(file, params) {
        const { date, class_id } = params;

        // Read Excel file
        const workbook = new ExcelJS.Workbook();

        await workbook.xlsx.read(file.buffer);

        const worksheet = workbook.worksheets[0];

        const rows = [];
        const errors = [];
        let validCount = 0;
        let errorCount = 0;

        // Collect all rows first
        const allRows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            allRows.push({ row, rowNumber });
        });

        // Process rows with async/await using for...of
        for (const { row, rowNumber } of allRows) {
            const nis = row.getCell(1).value;
            const status = row.getCell(2).value;
            const clock_in_at = row.getCell(3).value;
            const notes = row.getCell(4).value;

            if (!nis) {
                errors.push({
                    row: rowNumber,
                    nis: null,
                    error: 'NIS wajib diisi'
                });
                errorCount++;
                continue;
            }

            // Validate student
            const student = await Student.findOne({
                where: { nis },
                include: [
                    {
                        model: StudentClassHistory,
                        as: 'class_history',
                        where: {
                            class_id
                        },
                        required: true,
                        include: [
                            {
                                model: Class,
                                as: 'class_info',
                                attributes: ['id', 'name']
                            }
                        ],
                        limit: 1,
                        order: [['created_at', 'DESC']]
                    }
                ]
            });

            if (!student) {
                errors.push({
                    row: rowNumber,
                    nis,
                    error: 'Siswa tidak ditemukan atau tidak di kelas ini'
                });
                errorCount++;
            } else {
                // Validate status
                const validStatuses = ['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA'];
                if (!validStatuses.includes(status)) {
                    errors.push({
                        row: rowNumber,
                        nis,
                        error: `Status tidak valid. Gunakan: ${validStatuses.join(', ')}`
                    });
                    errorCount++;
                } else {
                    validCount++;
                    rows.push({
                        row_num: rowNumber,
                        nis,
                        student_name: student.full_name,
                        attendance_status: status,
                        clock_in_at: clock_in_at || null,
                        notes: notes || null,
                        status: 'valid',
                        error: null
                    });
                }
            }
        }

        return {
            success: true,
            data: {
                valid_count: validCount,
                error_count: errorCount,
                rows,
                errors
            }
        };
    }

    /**
     * Import attendance from file
     */
    async importAttendance(file, params) {
        const { date, class_id, created_by } = params;

        const validationResult = await this.validateImport(file, { date, class_id });

        if (validationResult.error_count > 0) {
            throw new Error(`File contains ${validationResult.error_count} errors. Please fix and try again.`);
        }

        let importedCount = 0;
        const failedRecords = [];

        for (const row of validationResult.data.rows) {
            try {
                const student = await Student.findOne({
                    where: { nis: row.nis },
                    include: [
                        {
                            model: StudentClassHistory,
                            as: 'class_history',
                            where: {
                                class_id
                            },
                            required: true,
                            include: [
                                {
                                    model: Class,
                                    as: 'class_info',
                                    attributes: ['id', 'name']
                                }
                            ],
                            limit: 1,
                            order: [['created_at', 'DESC']]
                        }
                    ]
                });

                if (student) {
                    // Check if exists
                    const existing = await StudentAttendance.findOne({
                        where: {
                            student_id: student.id,
                            attendance_date: date
                        }
                    });

                    if (existing) {
                        await existing.update({
                            status: row.attendance_status,
                            notes: row.notes,
                            input_method: 'import',
                            updated_by: created_by
                        });
                    } else {
                        await StudentAttendance.create({
                            student_id: student.id,
                            attendance_date: date,
                            status: row.attendance_status,
                            notes: row.notes,
                            input_method: 'import',
                            clock_in_at: row.clock_in_at ? `${date}T${row.clock_in_at}:00Z` : null,
                            created_by: created_by
                        });
                    }
                    importedCount++;
                }
            } catch (error) {
                failedRecords.push({ nis: row.nis, error: error.message });
            }
        }

        return {
            success: true,
            message: `Successfully imported ${importedCount} attendance records`,
            imported: importedCount,
            failed: failedRecords.length,
            failed_records: failedRecords
        };
    }

    /**
     * Download import template
     */
    async downloadTemplate(res) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template Absensi');

        // Add headers
        worksheet.columns = [
            { header: 'NIS', key: 'nis', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Jam_Masuk', key: 'clock_in_at', width: 15 },
            { header: 'Keterangan', key: 'notes', width: 30 }
        ];

        // Add example data
        worksheet.addRow({
            nis: '2021001',
            status: 'HADIR',
            clock_in_at: '07:00',
            notes: '-'
        });

        worksheet.addRow({
            nis: '2021002',
            status: 'TERLAMBAT',
            clock_in_at: '07:15',
            notes: 'Terlambat 15 menit'
        });

        worksheet.addRow({
            nis: '2021003',
            status: 'IZIN',
            clock_in_at: '',
            notes: 'Acara keluarga'
        });

        // Add info row
        worksheet.addRow([]);
        worksheet.addRow(['CATATAN:']);
        worksheet.addRow(['- Status yang valid: HADIR, TERLAMBAT, IZIN, SAKIT, ALPA']);
        worksheet.addRow(['- Jam_Masuk format: HH:MM (contoh: 07:00)']);
        worksheet.addRow(['- Kolom Jam_Masuk dan keterangan boleh dikosongkan untuk IZIN/SAKIT/ALPA']);

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=template_absensi_siswa.xlsx');

        await workbook.xlsx.write(res);
    }
}

module.exports = new StudentAttendanceService();
