const { Op } = require('sequelize');
const db = require('../../models');
const { Subject, Department } = db;
const { ensure, SUBJECT_TYPES } = require('./academic.validator');

class SubjectService {
    toBoolean(value, fallback = false) {
        if (typeof value === 'undefined') return fallback;
        if (typeof value === 'string') return value === 'true';
        return Boolean(value);
    }
    async findAll(query = {}) {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const where = {};
        if (query.search) {
            where[Op.or] = [
                { code: { [Op.like]: `%${query.search}%` } },
                { name: { [Op.like]: `%${query.search}%` } }
            ];
        }
        if (query.subject_type) where.subject_type = query.subject_type;
        if (query.department_id) where.department_id = query.department_id;
        if (query.department_id === 'null') where.department_id = null;
        if (typeof query.is_active !== 'undefined' && query.is_active !== '') {
            where.is_active = query.is_active === 'true' || query.is_active === true;
        }

        const { count, rows } = await Subject.findAndCountAll({
            where,
            include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'], required: false }],
            limit,
            offset,
            order: [[query.sortBy || 'name', query.sortDesc === 'true' ? 'DESC' : 'ASC']]
        });

        const summary = await Subject.findAll({
            attributes: ['subject_type', 'is_active', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total']],
            group: ['subject_type', 'is_active'],
            raw: true
        });

        const metrics = {
            total: 0,
            umum: 0,
            kejuruan: 0,
            active: 0
        };
        summary.forEach((row) => {
            const total = parseInt(row.total, 10) || 0;
            metrics.total += total;
            if (row.subject_type === 'UMUM') metrics.umum += total;
            if (row.subject_type === 'KEJURUAN') metrics.kejuruan += total;
            if (row.is_active) metrics.active += total;
        });

        return {
            totalItems: count,
            subjects: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            summary: metrics
        };
    }

    async findById(id) {
        const item = await Subject.findByPk(id, {
            include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'], required: false }]
        });
        ensure(item, 'Mata pelajaran tidak ditemukan', 'NOT_FOUND', 404);
        return item;
    }

    validatePayload(data = {}, isUpdate = false) {
        if (!isUpdate || Object.prototype.hasOwnProperty.call(data, 'code')) {
            ensure(data.code && String(data.code).trim().length > 0, 'Kode mapel wajib diisi');
        }
        if (!isUpdate || Object.prototype.hasOwnProperty.call(data, 'name')) {
            ensure(data.name && String(data.name).trim().length > 0, 'Nama mata pelajaran wajib diisi');
        }
        if (!isUpdate || Object.prototype.hasOwnProperty.call(data, 'subject_type')) {
            ensure(data.subject_type && SUBJECT_TYPES.includes(data.subject_type), 'Jenis mapel tidak valid');
        }
    }

    async create(data, user = {}) {
        this.validatePayload(data, false);
        const code = String(data.code).trim().toUpperCase();

        const existing = await Subject.findOne({ where: { code } });
        ensure(!existing, 'Kode mapel sudah digunakan', 'BUSINESS_RULE_ERROR', 422);

        return Subject.create({
            code,
            name: data.name,
            subject_type: data.subject_type,
            department_id: data.department_id || null,
            description: data.description || null,
            is_active: this.toBoolean(data.is_active, true),
            created_by: user.id || null,
            updated_by: user.id || null
        });
    }

    async update(id, data, user = {}) {
        this.validatePayload(data, true);
        const item = await this.findById(id);

        if (Object.prototype.hasOwnProperty.call(data, 'code')) {
            const code = String(data.code).trim().toUpperCase();
            const dup = await Subject.findOne({ where: { code, id: { [Op.ne]: id } } });
            ensure(!dup, 'Kode mapel sudah digunakan', 'BUSINESS_RULE_ERROR', 422);
        }

        await item.update({
            code: Object.prototype.hasOwnProperty.call(data, 'code') ? String(data.code).trim().toUpperCase() : item.code,
            name: Object.prototype.hasOwnProperty.call(data, 'name') ? data.name : item.name,
            subject_type: Object.prototype.hasOwnProperty.call(data, 'subject_type') ? data.subject_type : item.subject_type,
            department_id: Object.prototype.hasOwnProperty.call(data, 'department_id') ? (data.department_id || null) : item.department_id,
            description: Object.prototype.hasOwnProperty.call(data, 'description') ? (data.description || null) : item.description,
            is_active: Object.prototype.hasOwnProperty.call(data, 'is_active') ? this.toBoolean(data.is_active) : item.is_active,
            updated_by: user.id || null
        });

        return this.findById(id);
    }

    async toggleActive(id, user = {}) {
        const item = await this.findById(id);
        await item.update({ is_active: !item.is_active, updated_by: user.id || null });
        return this.findById(id);
    }

    async delete(id) {
        const item = await this.findById(id);
        await this.ensureSafeToDelete(item.id);
        await item.destroy();
        return true;
    }

    async ensureSafeToDelete(subjectId) {
        const [refs] = await db.sequelize.query(
            `SELECT table_name, column_name
             FROM information_schema.KEY_COLUMN_USAGE
             WHERE referenced_table_schema = DATABASE()
               AND referenced_table_name = 'subjects'
               AND referenced_column_name = 'id'`
        );

        for (const ref of refs) {
            const tableName = String(ref.table_name || '').replace(/`/g, '');
            const columnName = String(ref.column_name || '').replace(/`/g, '');
            if (!tableName || !columnName) continue;

            const [rows] = await db.sequelize.query(
                `SELECT COUNT(1) AS total FROM \`${tableName}\` WHERE \`${columnName}\` = :id`,
                { replacements: { id: subjectId } }
            );
            const total = parseInt(rows?.[0]?.total, 10) || 0;
            ensure(total === 0, 'Mata pelajaran sudah digunakan. Nonaktifkan data, jangan dihapus.', 'BUSINESS_RULE_ERROR', 422);
        }
    }
}

module.exports = new SubjectService();
