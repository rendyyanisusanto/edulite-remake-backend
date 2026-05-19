'use strict';

const { StudentViolation, StudentPositivePoint, Student, AcademicYear, StudentItemDeposit, StudentItemLoan, StudentItemCategory, Class } = require('../../models');
const { Op } = require('sequelize');
const minioSvc = require('../../core/services/minio.service');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

class MobileService {
    async resolveUserStudentIds(user) {
        if (!user) return [];
        if (user.student_id) return [user.student_id];

        const direct = await Student.findOne({ where: { user_id: user.id }, attributes: ['id'] }).catch(() => null);
        if (direct) return [direct.id];

        return [];
    }

    async getMyStudentItemDeposits(user, query = {}) {
        const studentIds = await this.resolveUserStudentIds(user);
        const where = {};
        if (studentIds.length) {
            where.student_id = { [Op.in]: studentIds };
        } else {
            where.current_status = { [Op.in]: ['DEPOSITED', 'BORROWED'] };
        }

        const rows = await StudentItemDeposit.findAll({
            where,
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                { model: StudentItemCategory, as: 'category', attributes: ['id', 'name'] },
                { model: Class, as: 'class', attributes: ['id', 'name'], required: false }
            ],
            order: [['id', 'DESC']],
            limit: parseInt(query.limit, 10) || 50
        });

        return { items: rows };
    }

    async getMyStudentItemLoans(user, query = {}) {
        const studentIds = await this.resolveUserStudentIds(user);
        const where = {};
        if (studentIds.length) where.student_id = { [Op.in]: studentIds };

        const rows = await StudentItemLoan.findAll({
            where,
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                { model: StudentItemDeposit, as: 'deposit', attributes: ['id', 'code', 'item_name', 'current_status'] }
            ],
            order: [['id', 'DESC']],
            limit: parseInt(query.limit, 10) || 50
        });

        return { items: rows };
    }

    async getActiveStudentItemDeposits(user, query = {}) {
        const rows = await StudentItemDeposit.findAll({
            where: { current_status: { [Op.in]: ['DEPOSITED', 'BORROWED'] } },
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                { model: StudentItemCategory, as: 'category', attributes: ['id', 'name'] },
                { model: Class, as: 'class', attributes: ['id', 'name'], required: false }
            ],
            order: [['id', 'DESC']],
            limit: parseInt(query.limit, 10) || 100
        });
        return { items: rows };
    }

    /**
     * Get the active academic year ID.
     */
    async getActiveAcademicYearId() {
        const activeYear = await AcademicYear.findOne({ where: { is_active: true } });
        if (!activeYear) {
            throw new Error('Tahun ajaran aktif tidak ditemukan. Harap hubungi admin.');
        }
        return activeYear.id;
    }

    /**
     * Search students for the mobile selector (fast search).
     */
    async searchStudents(q = '', limit = 20) {
        const where = {};
        if (q) {
            where[Op.or] = [
                { full_name: { [Op.like]: `%${q}%` } },
                { nis: { [Op.like]: `%${q}%` } }
            ];
        }

        const parsedLimit = parseInt(limit, 10) || 20;

        return await Student.findAll({
            where,
            attributes: ['id', 'full_name', 'nis'],
            limit: parsedLimit,
            order: [['full_name', 'ASC']]
        });
    }

    /**
     * Submits a new violation report.
     */
    async submitViolationReport(data, userId) {
        if (!data.student_id) throw new Error('Siswa wajib dipilih.');
        if (!data.date) throw new Error('Tanggal wajib diisi.');
        if (!data.description) throw new Error('Keterangan wajib diisi.');

        return await StudentViolation.create({
            student_id: data.student_id,
            date: data.date,
            location: data.location || null,
            description: data.description,
            photo: data.photo || null,
            status: 'PENDING',
            created_by: userId,
            type_id: null // To be filled by web admin
        });
    }

    /**
     * Submits a new positive behaviour report.
     */
    async submitPositiveReport(data, userId) {
        if (!data.student_id) throw new Error('Siswa wajib dipilih.');
        if (!data.date) throw new Error('Tanggal wajib diisi.');
        if (!data.description) throw new Error('Keterangan wajib diisi.');

        const academicYearId = await this.getActiveAcademicYearId();

        return await StudentPositivePoint.create({
            student_id: data.student_id,
            academic_year_id: academicYearId,
            date: data.date,
            location: data.location || null,
            description: data.description,
            photo: data.photo || null,
            status: 'PENDING',
            created_by: userId,
            type_id: null // To be filled by web admin
        });
    }

    /**
     * Get user's submitted violations.
     */
    async getMyViolations(userId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const { count, rows } = await StudentViolation.findAndCountAll({
            where: { created_by: userId },
            include: [{ model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] }],
            order: [['date', 'DESC'], ['created_at', 'DESC']],
            limit,
            offset
        });
        return { totalItems: count, data: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    /**
     * Get user's submitted positive points.
     */
    async getMyPositivePoints(userId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const { count, rows } = await StudentPositivePoint.findAndCountAll({
            where: { created_by: userId },
            include: [{ model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] }],
            order: [['date', 'DESC'], ['id', 'DESC']], // student_positive_points has no created_at, fallback to id/date
            limit,
            offset
        });
        return { totalItems: count, data: rows, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    /**
     * Get violation detail.
     */
    async getViolationDetail(id, userId) {
        const item = await StudentViolation.findOne({
            where: { id, created_by: userId },
            include: [{ model: Student, as: 'student' }]
        });
        if (!item) throw new Error('Laporan tidak ditemukan.');
        return item;
    }

    /**
     * Get positive point detail.
     */
    async getPositivePointDetail(id, userId) {
        const item = await StudentPositivePoint.findOne({
            where: { id, created_by: userId },
            include: [{ model: Student, as: 'student' }]
        });
        if (!item) throw new Error('Laporan tidak ditemukan.');
        return item;
    }

    /**
     * Upload photo helper.
     */
    async uploadPhoto(file, folderName) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            throw new Error('Tipe file tidak diizinkan. Gunakan JPEG, PNG, atau WebP.');
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new Error('Ukuran file melebihi batas 5 MB.');
        }
        return await minioSvc.uploadFile(folderName, file.originalname, file.buffer, file.mimetype);
    }
}

module.exports = new MobileService();
