const { Op } = require('sequelize');
const db = require('../../models');
const { LessonPeriodTemplate, LessonPeriod } = db;
const { ensure, PERIOD_TYPES, parseTimeToMinutes } = require('./academic.validator');

const isLesson = (periodType) => periodType === 'LESSON';

class LessonPeriodService {
    toBoolean(value, fallback = false) {
        if (typeof value === 'undefined') return fallback;
        if (typeof value === 'string') return value === 'true';
        return Boolean(value);
    }

    async listTemplates(query = {}) {
        const where = {};
        if (query.search) {
            where[Op.or] = [
                { code: { [Op.like]: `%${query.search}%` } },
                { name: { [Op.like]: `%${query.search}%` } }
            ];
        }
        if (typeof query.is_active !== 'undefined' && query.is_active !== '') {
            where.is_active = query.is_active === 'true' || query.is_active === true;
        }

        const templates = await LessonPeriodTemplate.findAll({
            where,
            include: [{ model: LessonPeriod, as: 'periods', attributes: ['id'] }],
            order: [['is_default', 'DESC'], ['name', 'ASC']]
        });

        return templates.map((item) => ({
            ...item.toJSON(),
            period_count: Array.isArray(item.periods) ? item.periods.length : 0
        }));
    }

    async findTemplateById(id) {
        const item = await LessonPeriodTemplate.findByPk(id, {
            include: [{ model: LessonPeriod, as: 'periods', separate: true, order: [['period_order', 'ASC']] }]
        });
        ensure(item, 'Template jam pelajaran tidak ditemukan', 'NOT_FOUND', 404);
        return item;
    }

    validateTemplatePayload(payload = {}, isUpdate = false) {
        if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'name')) {
            ensure(payload.name && String(payload.name).trim(), 'Nama template wajib diisi');
        }
        if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'code')) {
            ensure(payload.code && String(payload.code).trim(), 'Kode template wajib diisi');
        }
    }

    async createTemplate(payload = {}, user = {}) {
        this.validateTemplatePayload(payload, false);
        const code = String(payload.code).trim().toUpperCase();
        const dup = await LessonPeriodTemplate.findOne({ where: { code } });
        ensure(!dup, 'Kode template sudah digunakan', 'BUSINESS_RULE_ERROR', 422);

        return db.sequelize.transaction(async (transaction) => {
            if (this.toBoolean(payload.is_default) && this.toBoolean(payload.is_active, true)) {
                await LessonPeriodTemplate.update(
                    { is_default: false, updated_by: user.id || null },
                    { where: { is_default: true }, transaction }
                );
            }

            return LessonPeriodTemplate.create({
                name: payload.name,
                code,
                description: payload.description || null,
                is_default: this.toBoolean(payload.is_default),
                is_active: this.toBoolean(payload.is_active, true),
                created_by: user.id || null,
                updated_by: user.id || null
            }, { transaction });
        });
    }

    async updateTemplate(id, payload = {}, user = {}) {
        this.validateTemplatePayload(payload, true);

        return db.sequelize.transaction(async (transaction) => {
            const item = await LessonPeriodTemplate.findByPk(id, { transaction });
            ensure(item, 'Template jam pelajaran tidak ditemukan', 'NOT_FOUND', 404);

            if (Object.prototype.hasOwnProperty.call(payload, 'code')) {
                const code = String(payload.code).trim().toUpperCase();
                const dup = await LessonPeriodTemplate.findOne({ where: { code, id: { [Op.ne]: id } }, transaction });
                ensure(!dup, 'Kode template sudah digunakan', 'BUSINESS_RULE_ERROR', 422);
            }

            const nextIsActive = Object.prototype.hasOwnProperty.call(payload, 'is_active') ? this.toBoolean(payload.is_active) : item.is_active;
            const nextIsDefault = Object.prototype.hasOwnProperty.call(payload, 'is_default') ? this.toBoolean(payload.is_default) : item.is_default;

            if (nextIsDefault && nextIsActive) {
                await LessonPeriodTemplate.update(
                    { is_default: false, updated_by: user.id || null },
                    { where: { is_default: true, id: { [Op.ne]: id } }, transaction }
                );
            }

            await item.update({
                name: Object.prototype.hasOwnProperty.call(payload, 'name') ? payload.name : item.name,
                code: Object.prototype.hasOwnProperty.call(payload, 'code') ? String(payload.code).trim().toUpperCase() : item.code,
                description: Object.prototype.hasOwnProperty.call(payload, 'description') ? (payload.description || null) : item.description,
                is_default: nextIsDefault,
                is_active: nextIsActive,
                updated_by: user.id || null
            }, { transaction });

            if (!nextIsActive && nextIsDefault) {
                await item.update({ is_default: false }, { transaction });
            }

            return item;
        });
    }

    async setTemplateDefault(id, user = {}) {
        return db.sequelize.transaction(async (transaction) => {
            const item = await LessonPeriodTemplate.findByPk(id, { transaction });
            ensure(item, 'Template jam pelajaran tidak ditemukan', 'NOT_FOUND', 404);
            ensure(item.is_active, 'Template nonaktif tidak bisa dijadikan default', 'BUSINESS_RULE_ERROR', 422);

            await LessonPeriodTemplate.update(
                { is_default: false, updated_by: user.id || null },
                { where: { is_default: true }, transaction }
            );
            await item.update({ is_default: true, updated_by: user.id || null }, { transaction });
            return item;
        });
    }

    async toggleTemplateActive(id, user = {}) {
        return db.sequelize.transaction(async (transaction) => {
            const item = await LessonPeriodTemplate.findByPk(id, { transaction });
            ensure(item, 'Template jam pelajaran tidak ditemukan', 'NOT_FOUND', 404);
            const next = !item.is_active;
            await item.update({
                is_active: next,
                is_default: next ? item.is_default : false,
                updated_by: user.id || null
            }, { transaction });
            return item;
        });
    }

    async listPeriodsByTemplate(templateId) {
        await this.findTemplateById(templateId);
        return LessonPeriod.findAll({
            where: { template_id: templateId },
            order: [['period_order', 'ASC']]
        });
    }

    validatePeriodPayload(payload = {}, isUpdate = false) {
        if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'template_id')) {
            ensure(payload.template_id, 'Template wajib dipilih');
        }
        if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'period_order')) {
            ensure(payload.period_order !== null && payload.period_order !== '' && typeof payload.period_order !== 'undefined', 'Urutan wajib diisi');
        }
        if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'period_type')) {
            ensure(payload.period_type && PERIOD_TYPES.includes(payload.period_type), 'Jenis waktu tidak valid');
        }
        if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'name')) {
            ensure(payload.name && String(payload.name).trim(), 'Nama jam wajib diisi');
        }
        if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'start_time')) {
            ensure(payload.start_time, 'Waktu mulai wajib diisi');
        }
        if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'end_time')) {
            ensure(payload.end_time, 'Waktu selesai wajib diisi');
        }

        const start = parseTimeToMinutes(payload.start_time);
        const end = parseTimeToMinutes(payload.end_time);
        if (start !== null && end !== null) {
            ensure(start < end, 'Waktu selesai harus setelah waktu mulai');
        }

        if (payload.period_type === 'LESSON') {
            ensure(payload.period_number !== null && payload.period_number !== '' && typeof payload.period_number !== 'undefined', 'Jam ke wajib diisi untuk jenis Pelajaran');
        }
    }

    async ensurePeriodBusinessRules(payload = {}, periodId = null, transaction = null) {
        const templateId = payload.template_id;
        const template = await LessonPeriodTemplate.findByPk(templateId, { transaction });
        ensure(template, 'Template jam pelajaran tidak ditemukan', 'NOT_FOUND', 404);

        const periodOrder = parseInt(payload.period_order, 10);
        ensure(!Number.isNaN(periodOrder), 'Urutan harus berupa angka');

        const dupOrder = await LessonPeriod.findOne({
            where: {
                template_id: templateId,
                period_order: periodOrder,
                ...(periodId ? { id: { [Op.ne]: periodId } } : {})
            },
            transaction
        });
        ensure(!dupOrder, 'Urutan sudah digunakan pada template ini', 'BUSINESS_RULE_ERROR', 422);

        if (isLesson(payload.period_type) && payload.period_number !== null && payload.period_number !== '' && typeof payload.period_number !== 'undefined') {
            const periodNumber = parseInt(payload.period_number, 10);
            ensure(!Number.isNaN(periodNumber), 'Jam ke harus berupa angka');
            const dupPeriodNumber = await LessonPeriod.findOne({
                where: {
                    template_id: templateId,
                    period_type: 'LESSON',
                    period_number: periodNumber,
                    ...(periodId ? { id: { [Op.ne]: periodId } } : {})
                },
                transaction
            });
            ensure(!dupPeriodNumber, 'Jam ke sudah digunakan pada template ini', 'BUSINESS_RULE_ERROR', 422);
        }

        const start = parseTimeToMinutes(payload.start_time);
        const end = parseTimeToMinutes(payload.end_time);
        const existing = await LessonPeriod.findAll({
            where: {
                template_id: templateId,
                ...(periodId ? { id: { [Op.ne]: periodId } } : {})
            },
            transaction
        });

        const overlap = existing.some((item) => {
            const itemStart = parseTimeToMinutes(item.start_time);
            const itemEnd = parseTimeToMinutes(item.end_time);
            return start < itemEnd && end > itemStart;
        });
        ensure(!overlap, 'Rentang waktu bertabrakan dengan jam lain pada template ini', 'BUSINESS_RULE_ERROR', 422);
    }

    async createPeriod(payload = {}, user = {}) {
        this.validatePeriodPayload(payload, false);

        return db.sequelize.transaction(async (transaction) => {
            await this.ensurePeriodBusinessRules(payload, null, transaction);

            return LessonPeriod.create({
                template_id: payload.template_id,
                period_order: parseInt(payload.period_order, 10),
                period_number: isLesson(payload.period_type) && payload.period_number !== '' ? parseInt(payload.period_number, 10) : null,
                name: payload.name,
                period_type: payload.period_type,
                start_time: payload.start_time,
                end_time: payload.end_time,
                is_attendance_enabled: typeof payload.is_attendance_enabled === 'undefined'
                    ? isLesson(payload.period_type)
                    : this.toBoolean(payload.is_attendance_enabled),
                is_active: this.toBoolean(payload.is_active, true),
                created_by: user.id || null,
                updated_by: user.id || null
            }, { transaction });
        });
    }

    async updatePeriod(id, payload = {}, user = {}) {
        this.validatePeriodPayload(payload, true);

        return db.sequelize.transaction(async (transaction) => {
            const item = await LessonPeriod.findByPk(id, { transaction });
            ensure(item, 'Detail jam pelajaran tidak ditemukan', 'NOT_FOUND', 404);

            const nextPayload = {
                template_id: Object.prototype.hasOwnProperty.call(payload, 'template_id') ? payload.template_id : item.template_id,
                period_order: Object.prototype.hasOwnProperty.call(payload, 'period_order') ? payload.period_order : item.period_order,
                period_number: Object.prototype.hasOwnProperty.call(payload, 'period_number') ? payload.period_number : item.period_number,
                name: Object.prototype.hasOwnProperty.call(payload, 'name') ? payload.name : item.name,
                period_type: Object.prototype.hasOwnProperty.call(payload, 'period_type') ? payload.period_type : item.period_type,
                start_time: Object.prototype.hasOwnProperty.call(payload, 'start_time') ? payload.start_time : item.start_time,
                end_time: Object.prototype.hasOwnProperty.call(payload, 'end_time') ? payload.end_time : item.end_time
            };

            await this.ensurePeriodBusinessRules(nextPayload, id, transaction);

            await item.update({
                template_id: nextPayload.template_id,
                period_order: parseInt(nextPayload.period_order, 10),
                period_number: isLesson(nextPayload.period_type) && nextPayload.period_number !== '' ? parseInt(nextPayload.period_number, 10) : null,
                name: nextPayload.name,
                period_type: nextPayload.period_type,
                start_time: nextPayload.start_time,
                end_time: nextPayload.end_time,
                is_attendance_enabled: Object.prototype.hasOwnProperty.call(payload, 'is_attendance_enabled')
                    ? this.toBoolean(payload.is_attendance_enabled)
                    : item.is_attendance_enabled,
                is_active: Object.prototype.hasOwnProperty.call(payload, 'is_active') ? this.toBoolean(payload.is_active) : item.is_active,
                updated_by: user.id || null
            }, { transaction });

            return item;
        });
    }

    async togglePeriodActive(id, user = {}) {
        const item = await LessonPeriod.findByPk(id);
        ensure(item, 'Detail jam pelajaran tidak ditemukan', 'NOT_FOUND', 404);
        await item.update({ is_active: !item.is_active, updated_by: user.id || null });
        return item;
    }

    async deletePeriod(id) {
        const item = await LessonPeriod.findByPk(id);
        ensure(item, 'Detail jam pelajaran tidak ditemukan', 'NOT_FOUND', 404);
        await this.ensureSafeToDeletePeriod(item.id);
        await item.destroy();
        return true;
    }

    async ensureSafeToDeletePeriod(periodId) {
        const [refs] = await db.sequelize.query(
            `SELECT table_name, column_name
             FROM information_schema.KEY_COLUMN_USAGE
             WHERE referenced_table_schema = DATABASE()
               AND referenced_table_name = 'lesson_periods'
               AND referenced_column_name = 'id'`
        );

        for (const ref of refs) {
            const tableName = String(ref.table_name || '').replace(/`/g, '');
            const columnName = String(ref.column_name || '').replace(/`/g, '');
            if (!tableName || !columnName) continue;

            const [rows] = await db.sequelize.query(
                `SELECT COUNT(1) AS total FROM \`${tableName}\` WHERE \`${columnName}\` = :id`,
                { replacements: { id: periodId } }
            );
            const total = parseInt(rows?.[0]?.total, 10) || 0;
            ensure(total === 0, 'Jam pelajaran sudah digunakan. Nonaktifkan data, jangan dihapus.', 'BUSINESS_RULE_ERROR', 422);
        }
    }
}

module.exports = new LessonPeriodService();
