'use strict';

const { Op, fn, col } = require('sequelize');
const db = require('../../models');
const {
    StudentMutation,
    StudentMutationLog,
    Student,
    AcademicYear,
    User
} = db;
const minioSvc = require('../../core/services/minio.service');
const {
    OPEN_STATUSES,
    validateMutationPayload,
    validateActionStatus,
    ensure
} = require('./student_mutation.validator');

const MUTATION_FOLDER = 'student-mutations/documents';

class StudentMutationService {
    buildWhere(query = {}) {
        const where = {};

        if (query.student_id) where.student_id = query.student_id;
        if (query.academic_year_id) where.academic_year_id = query.academic_year_id;
        if (query.mutation_type) where.mutation_type = query.mutation_type;
        if (query.mutation_category) where.mutation_category = query.mutation_category;
        if (query.status) where.status = query.status;

        if (query.mutation_date_from || query.mutation_date_to) {
            where.mutation_date = {};
            if (query.mutation_date_from) where.mutation_date[Op.gte] = query.mutation_date_from;
            if (query.mutation_date_to) where.mutation_date[Op.lte] = query.mutation_date_to;
        }

        if (query.effective_date_from || query.effective_date_to) {
            where.effective_date = {};
            if (query.effective_date_from) where.effective_date[Op.gte] = query.effective_date_from;
            if (query.effective_date_to) where.effective_date[Op.lte] = query.effective_date_to;
        }

        return where;
    }

    buildKeywordWhere(search = '') {
        if (!search) return null;
        return {
            [Op.or]: [
                { '$student.full_name$': { [Op.like]: `%${search}%` } },
                { '$student.nis$': { [Op.like]: `%${search}%` } },
                { '$student.nisn$': { [Op.like]: `%${search}%` } },
                { document_number: { [Op.like]: `%${search}%` } },
                { origin_school: { [Op.like]: `%${search}%` } },
                { destination_school: { [Op.like]: `%${search}%` } }
            ]
        };
    }

    pickPayload(data = {}, partial = false) {
        const payload = {};
        const fields = [
            'student_id',
            'academic_year_id',
            'mutation_type',
            'mutation_category',
            'mutation_date',
            'effective_date',
            'origin_school',
            'destination_school',
            'reason',
            'description',
            'document_number',
            'notes'
        ];

        for (const field of fields) {
            if (!partial || Object.prototype.hasOwnProperty.call(data, field)) {
                payload[field] = data[field] || null;
            }
        }

        return payload;
    }

    async ensureStudentExists(studentId) {
        const student = await Student.findByPk(studentId, {
            attributes: ['id', 'full_name', 'student_status']
        });
        ensure(student, 'Siswa tidak ditemukan', 'NOT_FOUND', 404);
        return student;
    }

    async ensureNoOpenMutation(studentId, excludeId = null, transaction = null) {
        const where = {
            student_id: studentId,
            status: { [Op.in]: OPEN_STATUSES }
        };
        if (excludeId) where.id = { [Op.ne]: excludeId };

        const openMutation = await StudentMutation.findOne({ where, transaction });
        ensure(
            !openMutation,
            'Siswa masih memiliki proses mutasi aktif (DRAFT/SUBMITTED/APPROVED)',
            'BUSINESS_RULE_ERROR',
            422
        );
    }

    async ensureNoCompletedOutMutation(studentId, transaction = null) {
        const completedOut = await StudentMutation.findOne({
            where: {
                student_id: studentId,
                mutation_type: 'OUT',
                status: 'COMPLETED'
            },
            transaction
        });

        ensure(
            !completedOut,
            'Siswa sudah memiliki mutasi keluar yang selesai. Tidak dapat membuat mutasi OUT baru.',
            'BUSINESS_RULE_ERROR',
            422
        );
    }

    async writeLog(mutationId, action, userId, actionNote = null, transaction = null) {
        return StudentMutationLog.create(
            {
                mutation_id: mutationId,
                action,
                action_note: actionNote || null,
                action_by: userId
            },
            { transaction }
        );
    }

    async resolveDocumentUpload(file, oldFile = null) {
        if (!file) return oldFile;
        const uploadedUrl = await minioSvc.uploadFile(
            MUTATION_FOLDER,
            file.originalname,
            file.buffer,
            file.mimetype
        );

        if (oldFile) {
            await minioSvc.deleteFile(oldFile);
        }

        return uploadedUrl;
    }

    async findAll(query = {}) {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const where = this.buildWhere(query);
        const keywordWhere = this.buildKeywordWhere(query.search || query.keyword || '');
        const finalWhere = keywordWhere ? { ...where, ...keywordWhere } : where;

        const { count, rows } = await StudentMutation.findAndCountAll({
            where: finalWhere,
            include: [
                { model: Student, as: 'student', attributes: ['id', 'nis', 'nisn', 'full_name', 'student_status'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'], required: false },
                { model: User, as: 'creator', attributes: ['id', 'name'], required: false },
                { model: User, as: 'approver', attributes: ['id', 'name'], required: false }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
            distinct: true
        });

        return {
            totalItems: count,
            mutations: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const mutation = await StudentMutation.findByPk(id, {
            include: [
                { model: Student, as: 'student', attributes: ['id', 'nis', 'nisn', 'full_name', 'student_status'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'], required: false },
                { model: User, as: 'creator', attributes: ['id', 'name'], required: false },
                { model: User, as: 'updater', attributes: ['id', 'name'], required: false },
                { model: User, as: 'approver', attributes: ['id', 'name'], required: false },
                {
                    model: StudentMutationLog,
                    as: 'logs',
                    include: [{ model: User, as: 'actor', attributes: ['id', 'name'] }],
                    required: false
                }
            ],
            order: [[{ model: StudentMutationLog, as: 'logs' }, 'created_at', 'DESC']]
        });

        ensure(mutation, 'Data mutasi tidak ditemukan', 'NOT_FOUND', 404);
        return mutation;
    }

    async findByStudentId(studentId, query = {}) {
        await this.ensureStudentExists(studentId);
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const where = { student_id: studentId };
        if (query.status) where.status = query.status;
        if (query.mutation_type) where.mutation_type = query.mutation_type;

        const { count, rows } = await StudentMutation.findAndCountAll({
            where,
            include: [
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'], required: false },
                { model: User, as: 'creator', attributes: ['id', 'name'], required: false }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        return {
            totalItems: count,
            mutations: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async create(payload = {}, user = {}, file = null) {
        validateMutationPayload(payload, false);

        let mutationId;
        await db.sequelize.transaction(async (transaction) => {
            await this.ensureStudentExists(payload.student_id);
            await this.ensureNoOpenMutation(payload.student_id, null, transaction);
            if (payload.mutation_type === 'OUT') {
                await this.ensureNoCompletedOutMutation(payload.student_id, transaction);
            }

            const mutationPayload = this.pickPayload(payload);
            mutationPayload.status = 'DRAFT';
            mutationPayload.created_by = user.id;
            mutationPayload.updated_by = user.id;

            if (file) {
                mutationPayload.document_file = await this.resolveDocumentUpload(file);
            }

            const mutation = await StudentMutation.create(mutationPayload, { transaction });
            await this.writeLog(mutation.id, 'CREATED', user.id, payload.notes, transaction);
            mutationId = mutation.id;
        });
        return this.findById(mutationId);
    }

    async update(id, payload = {}, user = {}, file = null) {
        validateMutationPayload(payload, true);

        return db.sequelize.transaction(async (transaction) => {
            const mutation = await StudentMutation.findByPk(id, { transaction });
            ensure(mutation, 'Data mutasi tidak ditemukan', 'NOT_FOUND', 404);
            validateActionStatus(mutation.status, ['DRAFT'], 'update');

            const mutationPayload = this.pickPayload(payload, true);
            if (Object.prototype.hasOwnProperty.call(mutationPayload, 'student_id') && mutationPayload.student_id) {
                await this.ensureStudentExists(mutationPayload.student_id);
                await this.ensureNoOpenMutation(mutationPayload.student_id, mutation.id, transaction);
                if ((mutationPayload.mutation_type || mutation.mutation_type) === 'OUT') {
                    await this.ensureNoCompletedOutMutation(mutationPayload.student_id, transaction);
                }
            }

            if (file) {
                mutationPayload.document_file = await this.resolveDocumentUpload(file, mutation.document_file);
            }

            mutationPayload.updated_by = user.id;
            await mutation.update(mutationPayload, { transaction });
            await this.writeLog(mutation.id, 'UPDATED', user.id, payload.notes, transaction);
            return this.findById(mutation.id);
        });
    }

    async submit(id, payload = {}, user = {}) {
        return db.sequelize.transaction(async (transaction) => {
            const mutation = await StudentMutation.findByPk(id, { transaction });
            ensure(mutation, 'Data mutasi tidak ditemukan', 'NOT_FOUND', 404);
            validateActionStatus(mutation.status, ['DRAFT'], 'submit');

            await mutation.update(
                {
                    status: 'SUBMITTED',
                    notes: payload.notes || mutation.notes,
                    updated_by: user.id
                },
                { transaction }
            );
            await this.writeLog(mutation.id, 'SUBMITTED', user.id, payload.notes, transaction);
            return this.findById(mutation.id);
        });
    }

    async approve(id, payload = {}, user = {}) {
        return db.sequelize.transaction(async (transaction) => {
            const mutation = await StudentMutation.findByPk(id, { transaction });
            ensure(mutation, 'Data mutasi tidak ditemukan', 'NOT_FOUND', 404);
            validateActionStatus(mutation.status, ['SUBMITTED'], 'approve');

            await mutation.update(
                {
                    status: 'APPROVED',
                    approved_by: user.id,
                    approved_at: new Date(),
                    notes: payload.notes || mutation.notes,
                    updated_by: user.id
                },
                { transaction }
            );
            await this.writeLog(mutation.id, 'APPROVED', user.id, payload.notes, transaction);
            return this.findById(mutation.id);
        });
    }

    async reject(id, payload = {}, user = {}) {
        ensure(payload.notes, 'Catatan penolakan wajib diisi');

        return db.sequelize.transaction(async (transaction) => {
            const mutation = await StudentMutation.findByPk(id, { transaction });
            ensure(mutation, 'Data mutasi tidak ditemukan', 'NOT_FOUND', 404);
            validateActionStatus(mutation.status, ['SUBMITTED'], 'reject');

            await mutation.update(
                {
                    status: 'REJECTED',
                    notes: payload.notes,
                    updated_by: user.id
                },
                { transaction }
            );
            await this.writeLog(mutation.id, 'REJECTED', user.id, payload.notes, transaction);
            return this.findById(mutation.id);
        });
    }

    resolveStudentStatusOnComplete(mutationType, mutationCategory) {
        if (mutationType === 'IN') return 'ACTIVE';
        if (mutationCategory === 'GRADUATED') return 'GRADUATED';
        if (mutationCategory === 'DROPOUT') return 'DROPPED';
        return 'MUTATED_OUT';
    }

    async complete(id, payload = {}, user = {}) {
        return db.sequelize.transaction(async (transaction) => {
            const mutation = await StudentMutation.findByPk(id, { transaction });
            ensure(mutation, 'Data mutasi tidak ditemukan', 'NOT_FOUND', 404);
            validateActionStatus(mutation.status, ['APPROVED'], 'complete');

            const student = await Student.findByPk(mutation.student_id, { transaction });
            ensure(student, 'Siswa tidak ditemukan', 'NOT_FOUND', 404);

            const newStudentStatus = this.resolveStudentStatusOnComplete(mutation.mutation_type, mutation.mutation_category);

            await mutation.update(
                {
                    status: 'COMPLETED',
                    notes: payload.notes || mutation.notes,
                    updated_by: user.id
                },
                { transaction }
            );

            await student.update(
                {
                    student_status: newStudentStatus
                },
                { transaction }
            );

            await this.writeLog(mutation.id, 'COMPLETED', user.id, payload.notes, transaction);
            return this.findById(mutation.id);
        });
    }

    async cancel(id, payload = {}, user = {}) {
        return db.sequelize.transaction(async (transaction) => {
            const mutation = await StudentMutation.findByPk(id, { transaction });
            ensure(mutation, 'Data mutasi tidak ditemukan', 'NOT_FOUND', 404);
            validateActionStatus(mutation.status, ['DRAFT', 'SUBMITTED'], 'cancel');

            await mutation.update(
                {
                    status: 'CANCELLED',
                    notes: payload.notes || mutation.notes,
                    updated_by: user.id
                },
                { transaction }
            );
            await this.writeLog(mutation.id, 'CANCELLED', user.id, payload.notes, transaction);
            return this.findById(mutation.id);
        });
    }

    async uploadDocument(id, file, user = {}) {
        ensure(file, 'File dokumen wajib diunggah');
        return db.sequelize.transaction(async (transaction) => {
            const mutation = await StudentMutation.findByPk(id, { transaction });
            ensure(mutation, 'Data mutasi tidak ditemukan', 'NOT_FOUND', 404);
            validateActionStatus(mutation.status, ['DRAFT', 'SUBMITTED', 'APPROVED'], 'upload dokumen');

            const fileUrl = await this.resolveDocumentUpload(file, mutation.document_file);
            await mutation.update(
                {
                    document_file: fileUrl,
                    updated_by: user.id
                },
                { transaction }
            );
            await this.writeLog(mutation.id, 'DOCUMENT_UPLOADED', user.id, null, transaction);
            return this.findById(mutation.id);
        });
    }

    async report(query = {}) {
        const where = this.buildWhere(query);
        const keywordWhere = this.buildKeywordWhere(query.search || query.keyword || '');
        const finalWhere = keywordWhere ? { ...where, ...keywordWhere } : where;

        const mutations = await StudentMutation.findAll({
            where: finalWhere,
            include: [
                { model: Student, as: 'student', attributes: ['id', 'nis', 'nisn', 'full_name'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'], required: false }
            ],
            order: [['mutation_date', 'DESC']]
        });

        const summaryByType = await StudentMutation.findAll({
            attributes: ['mutation_type', [fn('COUNT', col('id')), 'total']],
            where: finalWhere,
            group: ['mutation_type'],
            raw: true
        });

        const summaryByCategory = await StudentMutation.findAll({
            attributes: ['mutation_category', [fn('COUNT', col('id')), 'total']],
            where: finalWhere,
            group: ['mutation_category'],
            raw: true
        });

        const summaryByStatus = await StudentMutation.findAll({
            attributes: ['status', [fn('COUNT', col('id')), 'total']],
            where: finalWhere,
            group: ['status'],
            raw: true
        });

        const pickCount = (rows, key, value) => {
            const found = rows.find((row) => row[key] === value);
            return found ? Number(found.total) : 0;
        };

        return {
            summary: {
                total_mutations: mutations.length,
                total_mutation_in: pickCount(summaryByType, 'mutation_type', 'IN'),
                total_mutation_out: pickCount(summaryByType, 'mutation_type', 'OUT'),
                total_approved: pickCount(summaryByStatus, 'status', 'APPROVED'),
                total_completed: pickCount(summaryByStatus, 'status', 'COMPLETED'),
                total_rejected: pickCount(summaryByStatus, 'status', 'REJECTED')
            },
            summary_by_type: summaryByType,
            summary_by_category: summaryByCategory,
            summary_by_status: summaryByStatus,
            items: mutations
        };
    }
}

module.exports = new StudentMutationService();
