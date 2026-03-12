const { Student, ParentProfile, StudentDocument, StudentClassHistory, Class } = require('../../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

class StudentService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';
        const classId = query.class_id;

        const whereCondition = {};
        if (search) {
            whereCondition[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { nis: { [Op.like]: `%${search}%` } },
                { nisn: { [Op.like]: `%${search}%` } }
            ];
        }

        const include = [
            {
                model: StudentClassHistory,
                as: 'class_history',
                required: classId ? true : false,
                where: classId ? { class_id: classId } : undefined,
                include: [
                    { model: Class, as: 'class_info', attributes: ['id', 'name'] }
                ]
            }
        ];

        const students = await Student.findAndCountAll({
            where: whereCondition,
            include,
            limit,
            offset,
            order: [['created_at', 'DESC']],
            distinct: true
        });

        return {
            totalItems: students.count,
            students: students.rows,
            totalPages: Math.ceil(students.count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const student = await Student.findByPk(id, {
            include: [
                { model: ParentProfile, as: 'parents' },
                { model: StudentDocument, as: 'documents' }
            ]
        });
        if (!student) {
            throw new Error(`Student with id ${id} not found`);
        }
        return student;
    }

    async create(data) {
        // Validation could be added here or in middleware
        return await Student.create(data);
    }

    async update(id, data) {
        const student = await this.findById(id);
        return await student.update(data);
    }

    async delete(id) {
        const student = await this.findById(id);
        return await student.destroy();
    }

    async generateTemplate(res) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template Siswa');

        worksheet.columns = [
            { header: 'NIS', key: 'nis', width: 20 },
            { header: 'NISN', key: 'nisn', width: 20 },
            { header: 'Nama Lengkap', key: 'full_name', width: 30 },
            { header: 'Gender (L/P)', key: 'gender', width: 15 },
            { header: 'Tanggal Lahir (YYYY-MM-DD)', key: 'date_of_birth', width: 30 },
            { header: 'Alamat', key: 'address', width: 40 }
        ];

        // Add dummy data row
        worksheet.addRow({
            nis: '10001',
            nisn: '0012345678',
            full_name: 'John Doe',
            gender: 'L',
            date_of_birth: '2010-01-01',
            address: 'Jl. Contoh No. 123'
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'template_siswa.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    }

    async exportExcel(res, query) {
        const result = await this.findAll({ ...query, limit: 10000 }); // Large limit for export
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Siswa');

        worksheet.columns = [
            { header: 'NIS', key: 'nis', width: 20 },
            { header: 'NISN', key: 'nisn', width: 20 },
            { header: 'Nama Lengkap', key: 'full_name', width: 30 },
            { header: 'Gender', key: 'gender', width: 10 },
            { header: 'Tanggal Lahir', key: 'date_of_birth', width: 20 },
            { header: 'Alamat', key: 'address', width: 40 },
            { header: 'Tanggal Dibuat', key: 'created_at', width: 25 },
        ];

        result.students.forEach(student => {
            worksheet.addRow({
                nis: student.nis,
                nisn: student.nisn,
                full_name: student.full_name,
                gender: student.gender,
                date_of_birth: student.date_of_birth,
                address: student.address,
                created_at: student.createdAt,
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'data_siswa.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    }

    async importExcel(buffer, userId) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
            throw new Error('Worksheet not found in Excel file');
        }

        const studentsToInsert = [];
        const errors = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const nis = row.getCell(1).value?.toString();
            const nisn = row.getCell(2).value?.toString() || null;
            const full_name = row.getCell(3).value?.toString();
            const gender = row.getCell(4).value?.toString();
            const rawDate = row.getCell(5).value;
            const address = row.getCell(6).value?.toString() || null;

            if (!nis || !full_name || !gender) {
                errors.push(`Row ${rowNumber}: Kolom wajib (NIS, Nama lengkap, atau Gender) kosong`);
                return;
            }

            let date_of_birth = null;
            if (rawDate) {
                // Determine format
                if (rawDate instanceof Date) {
                    date_of_birth = rawDate.toISOString().split('T')[0];
                } else if (typeof rawDate === 'string') {
                    // Assuming YYYY-MM-DD or parseable
                    const d = new Date(rawDate);
                    if (!isNaN(d.getTime())) {
                        date_of_birth = d.toISOString().split('T')[0];
                    } else {
                        errors.push(`Row ${rowNumber}: Format tanggal salah`);
                        return;
                    }
                }
            }

            studentsToInsert.push({
                nis,
                nisn,
                full_name,
                gender: gender.toUpperCase(),
                date_of_birth,
                address
            });
        });

        if (errors.length > 0) {
            throw new Error('Validasi Error:\n' + errors.join('\n'));
        }

        // Check duplicates if needed or rely on database constraints

        // Bulk Insert using model
        if (studentsToInsert.length > 0) {
            await Student.bulkCreate(studentsToInsert, { ignoreDuplicates: true });
        }

        return {
            importedCount: studentsToInsert.length
        };
    }
}

module.exports = new StudentService();
