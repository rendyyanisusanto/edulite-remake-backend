'use strict';

const db = require('../../models');
const { PermissionLetter, PermissionLetterStudent, Teacher, Student, User } = db;
const { Op } = require('sequelize');

class PermissionLetterService {

    _generateCode() {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `SIZ-${dateStr}-${rand}`;
    }

    _toRoman(month) {
        const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return romans[month - 1] || String(month);
    }

    async generateCode() {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const year = now.getFullYear();
        const romanMonth = this._toRoman(month);
        const fixedPart = '104.26/SPm/SMK.IT';
        const suffix = `/${fixedPart}/${romanMonth}/${year}`;

        const count = await PermissionLetter.count({
            where: {
                code: { [Op.like]: `%${suffix}` }
            }
        });

        const nextNumber = count + 1;
        const paddedNumber = String(nextNumber).padStart(3, '0');
        return `${paddedNumber}${suffix}`;
    }

    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';

        const where = {};

        if (search) {
            where[Op.or] = [
                { code: { [Op.like]: `%${search}%` } },
                { activity_name: { [Op.like]: `%${search}%` } },
                { purpose: { [Op.like]: `%${search}%` } },
                { location: { [Op.like]: `%${search}%` } },
                { companion_name: { [Op.like]: `%${search}%` } }
            ];
        }

        if (query.status) where.status = query.status;
        if (query.teacher_id) where.teacher_id = query.teacher_id;

        if (query.date_from || query.date_to) {
            where.start_date = {};
            if (query.date_from) where.start_date[Op.gte] = query.date_from;
            if (query.date_to) where.start_date[Op.lte] = query.date_to;
        }

        const { count, rows } = await PermissionLetter.findAndCountAll({
            where,
            include: [
                { model: Teacher, as: 'teacher', attributes: ['id', 'full_name', 'nip'] },
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                {
                    model: PermissionLetterStudent,
                    as: 'students',
                    attributes: ['id', 'student_id'],
                    required: false
                }
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']],
            distinct: true
        });

        return {
            totalItems: count,
            permissionLetters: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const item = await PermissionLetter.findByPk(id, {
            include: [
                { model: Teacher, as: 'teacher', attributes: ['id', 'full_name', 'nip', 'position'] },
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: User, as: 'updater', attributes: ['id', 'name'] },
                { model: User, as: 'approver', attributes: ['id', 'name'] },
                {
                    model: PermissionLetterStudent,
                    as: 'students',
                    include: [
                        {
                            model: Student,
                            as: 'student',
                            attributes: ['id', 'full_name', 'nis', 'nisn']
                        }
                    ]
                }
            ]
        });
        if (!item) throw new Error('Surat izin tidak ditemukan');
        return item;
    }

    async create(data) {
        const { students = [], ...letterData } = data;

        if (!letterData.activity_name) throw new Error('Nama kegiatan wajib diisi');
        if (!letterData.start_date) throw new Error('Tanggal mulai wajib diisi');
        if (!students || students.length === 0) throw new Error('Minimal 1 siswa harus dipilih');

        // Validate no duplicate student_ids
        const studentIds = students.map(s => (typeof s === 'object' ? s.student_id : s));
        const uniqueIds = [...new Set(studentIds)];
        if (uniqueIds.length !== studentIds.length) {
            throw new Error('Terdapat siswa duplikat dalam daftar');
        }

        // Auto-generate code if not provided
        if (!letterData.code) {
            letterData.code = this._generateCode();
        }

        // Snapshot companion_name from teacher if not manually set
        if (letterData.teacher_id && !letterData.companion_name) {
            const teacher = await Teacher.findByPk(letterData.teacher_id);
            if (teacher) letterData.companion_name = teacher.full_name;
        }

        const t = await db.sequelize.transaction();
        try {
            const letter = await PermissionLetter.create(
                { ...letterData, status: 'DRAFT' },
                { transaction: t }
            );

            const studentRecords = students.map(s => ({
                permission_letter_id: letter.id,
                student_id: typeof s === 'object' ? s.student_id : s,
                notes: typeof s === 'object' ? (s.notes || null) : null
            }));

            await PermissionLetterStudent.bulkCreate(studentRecords, { transaction: t });

            await t.commit();
            return await this.findById(letter.id);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async update(id, data) {
        const { students, ...letterData } = data;
        const item = await this.findById(id);

        // Snapshot companion_name if teacher changed
        if (letterData.teacher_id && letterData.teacher_id !== item.teacher_id && !letterData.companion_name) {
            const teacher = await Teacher.findByPk(letterData.teacher_id);
            if (teacher) letterData.companion_name = teacher.full_name;
        }

        const t = await db.sequelize.transaction();
        try {
            await item.update(letterData, { transaction: t });

            if (students !== undefined) {
                if (students.length === 0) throw new Error('Minimal 1 siswa harus dipilih');

                const studentIds = students.map(s => (typeof s === 'object' ? s.student_id : s));
                const uniqueIds = [...new Set(studentIds)];
                if (uniqueIds.length !== studentIds.length) {
                    throw new Error('Terdapat siswa duplikat dalam daftar');
                }

                // Sync: delete existing, insert new
                await PermissionLetterStudent.destroy({
                    where: { permission_letter_id: id },
                    transaction: t
                });

                const studentRecords = students.map(s => ({
                    permission_letter_id: id,
                    student_id: typeof s === 'object' ? s.student_id : s,
                    notes: typeof s === 'object' ? (s.notes || null) : null
                }));

                await PermissionLetterStudent.bulkCreate(studentRecords, { transaction: t });
            }

            await t.commit();
            return await this.findById(id);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async submit(id, userId) {
        const item = await this.findById(id);
        if (item.status !== 'DRAFT') {
            throw new Error('Hanya surat dengan status DRAFT yang dapat diajukan');
        }
        return await item.update({ status: 'PENDING', updated_by: userId });
    }

    async approve(id, userId) {
        const item = await this.findById(id);
        if (item.status !== 'PENDING') {
            throw new Error('Hanya surat dengan status PENDING yang dapat disetujui');
        }
        return await item.update({
            status: 'APPROVED',
            approved_at: new Date(),
            approved_by: userId,
            updated_by: userId
        });
    }

    async reject(id, userId) {
        const item = await this.findById(id);
        if (item.status !== 'PENDING') {
            throw new Error('Hanya surat dengan status PENDING yang dapat ditolak');
        }
        return await item.update({ status: 'REJECTED', updated_by: userId });
    }

    async cancel(id, userId) {
        const item = await this.findById(id);
        if (['CANCELLED', 'FINISHED'].includes(item.status)) {
            throw new Error('Surat sudah tidak dapat dibatalkan');
        }
        return await item.update({ status: 'CANCELLED', updated_by: userId });
    }

    async delete(id) {
        const item = await this.findById(id);
        return await item.destroy();
    }
}

module.exports = new PermissionLetterService();
