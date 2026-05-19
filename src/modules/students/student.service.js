const {
    Student,
    ParentProfile,
    ParentDocument,
    StudentDocument,
    StudentClassHistory,
    Class,
    sequelize
} = require('../../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

class StudentService {
    pickStudentPayload(data = {}, partial = false) {
        const payload = {};
        const fields = [
            'nis',
            'nisn',
            'full_name',
            'gender',
            'date_of_birth',
            'address',
            'rfid_code',
            'rfid_is_active',
            'rfid_assigned_at',
            'qr_code',
            'barcode',
            'card_template_id',
            'card_number',
            'photo'
        ];

        for (const field of fields) {
            if (!partial || Object.prototype.hasOwnProperty.call(data, field)) {
                payload[field] = data[field] ?? null;
            }
        }

        return payload;
    }

    pickParentPayload(data = {}) {
        return {
            type: data.type || null,
            full_name: data.full_name || null,
            nik: data.nik || null,
            phone: data.phone || null,
            email: data.email || null,
            occupation: data.occupation || null,
            education: data.education || null,
            is_guardian: Boolean(data.is_guardian),
            address: data.address || null
        };
    }

    pickParentDocumentPayload(data = {}) {
        return {
            document_type: data.document_type || null,
            document_file: data.document_file || null
        };
    }

    hasParentData(parent = {}) {
        const fields = [
            'type',
            'full_name',
            'nik',
            'phone',
            'email',
            'occupation',
            'education',
            'address'
        ];

        if (parent.is_guardian === true) return true;
        if (Array.isArray(parent.documents) && parent.documents.length > 0) {
            return parent.documents.some((doc) => this.hasParentDocumentData(doc));
        }

        return fields.some((field) => String(parent[field] || '').trim() !== '');
    }

    hasParentDocumentData(doc = {}) {
        return ['document_type', 'document_file'].some(
            (field) => String(doc[field] || '').trim() !== ''
        );
    }

    async syncParentDocuments(parentId, documents = [], transaction) {
        const existingDocs = await ParentDocument.findAll({
            where: { parent_id: parentId },
            transaction
        });
        const existingDocMap = new Map(existingDocs.map((doc) => [doc.id, doc]));
        const retainedDocIds = [];

        for (const docInput of documents) {
            if (!this.hasParentDocumentData(docInput)) {
                continue;
            }

            const payload = this.pickParentDocumentPayload(docInput);
            const inputId = docInput.id ? Number(docInput.id) : null;

            if (inputId && existingDocMap.has(inputId)) {
                const existingDoc = existingDocMap.get(inputId);
                await existingDoc.update(payload, { transaction });
                retainedDocIds.push(existingDoc.id);
            } else {
                const createdDoc = await ParentDocument.create(
                    {
                        ...payload,
                        parent_id: parentId
                    },
                    { transaction }
                );
                retainedDocIds.push(createdDoc.id);
            }
        }

        const deletedDocIds = existingDocs
            .map((doc) => doc.id)
            .filter((id) => !retainedDocIds.includes(id));

        if (deletedDocIds.length > 0) {
            await ParentDocument.destroy({
                where: {
                    id: deletedDocIds,
                    parent_id: parentId
                },
                transaction
            });
        }
    }

    async syncParents(studentId, parents = [], transaction) {
        const existingParents = await ParentProfile.findAll({
            where: { student_id: studentId },
            include: [{ model: ParentDocument, as: 'documents' }],
            transaction
        });
        const existingParentMap = new Map(existingParents.map((parent) => [parent.id, parent]));
        const retainedParentIds = [];

        for (const parentInput of parents) {
            if (!this.hasParentData(parentInput)) {
                continue;
            }

            const payload = this.pickParentPayload(parentInput);
            const documents = Array.isArray(parentInput.documents) ? parentInput.documents : [];
            const inputId = parentInput.id ? Number(parentInput.id) : null;

            let parentRecord;
            if (inputId && existingParentMap.has(inputId)) {
                parentRecord = existingParentMap.get(inputId);
                await parentRecord.update(payload, { transaction });
            } else {
                parentRecord = await ParentProfile.create(
                    {
                        ...payload,
                        student_id: studentId
                    },
                    { transaction }
                );
            }

            retainedParentIds.push(parentRecord.id);
            await this.syncParentDocuments(parentRecord.id, documents, transaction);
        }

        const deletedParentIds = existingParents
            .map((parent) => parent.id)
            .filter((id) => !retainedParentIds.includes(id));

        if (deletedParentIds.length > 0) {
            await ParentProfile.destroy({
                where: {
                    id: deletedParentIds,
                    student_id: studentId
                },
                transaction
            });
        }
    }

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
                {
                    model: ParentProfile,
                    as: 'parents',
                    include: [{ model: ParentDocument, as: 'documents' }]
                },
                { model: StudentDocument, as: 'documents' }
            ]
        });
        if (!student) {
            throw new Error(`Student with id ${id} not found`);
        }
        return student;
    }

    async create(data) {
        const transaction = await sequelize.transaction();
        try {
            const studentPayload = this.pickStudentPayload(data);
            const parents = Array.isArray(data.parents) ? data.parents : [];

            const student = await Student.create(studentPayload, { transaction });
            await this.syncParents(student.id, parents, transaction);

            await transaction.commit();
            return await this.findById(student.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async update(id, data) {
        const transaction = await sequelize.transaction();
        try {
            const student = await Student.findByPk(id, { transaction });
            if (!student) {
                throw new Error(`Student with id ${id} not found`);
            }

            const studentPayload = this.pickStudentPayload(data, true);
            await student.update(studentPayload, { transaction });

            if (Array.isArray(data.parents)) {
                await this.syncParents(student.id, data.parents, transaction);
            }

            await transaction.commit();
            return await this.findById(student.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
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
