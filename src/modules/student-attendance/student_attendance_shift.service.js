'use strict';

const { Op } = require('sequelize');
const db = require('../../models');
const {
    StudentAttendanceShift,
    StudentAttendanceShiftClass,
    StudentAttendanceShiftStudent,
    AcademicYear,
    Class,
    Student,
    User
} = db;
const {
    ensure,
    validateShiftPayload,
    validateClassMappingPayload,
    validateStudentOverridePayload
} = require('./student_attendance.validator');

class StudentAttendanceShiftService {
    async listShifts(query = {}) {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        const offset = (page - 1) * limit;

        const where = {};
        if (query.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${query.search}%` } },
                { code: { [Op.like]: `%${query.search}%` } }
            ];
        }
        if (query.academic_year_id) where.academic_year_id = query.academic_year_id;
        if (typeof query.is_active !== 'undefined' && query.is_active !== '') {
            where.is_active = query.is_active === 'true' || query.is_active === true;
        }

        const { count, rows } = await StudentAttendanceShift.findAndCountAll({
            where,
            include: [{ model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'], required: false }],
            order: [['name', 'ASC']],
            limit,
            offset
        });

        return {
            totalItems: count,
            shifts: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async findShiftById(id, options = {}) {
        const shift = await StudentAttendanceShift.findByPk(id, {
            transaction: options.transaction,
            include: [{ model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'], required: false }]
        });
        ensure(shift, 'Shift RFID siswa tidak ditemukan', 'NOT_FOUND', 404);
        return shift;
    }

    async createShift(payload = {}, user = {}) {
        validateShiftPayload(payload, false);

        return db.sequelize.transaction(async (transaction) => {
            const created = await StudentAttendanceShift.create(
                {
                    name: payload.name,
                    code: payload.code || null,
                    academic_year_id: payload.academic_year_id || null,
                    clock_in_start: payload.clock_in_start,
                    late_after: payload.late_after,
                    clock_in_end: payload.clock_in_end,
                    clock_out_start: payload.clock_out_start || null,
                    clock_out_end: payload.clock_out_end || null,
                    allow_checkout: typeof payload.allow_checkout === 'undefined' ? true : Boolean(payload.allow_checkout),
                    is_active: typeof payload.is_active === 'undefined' ? true : Boolean(payload.is_active),
                    notes: payload.notes || null,
                    updated_by: user.id || null
                },
                { transaction }
            );

            return this.findShiftById(created.id, { transaction });
        });
    }

    async updateShift(id, payload = {}, user = {}) {
        validateShiftPayload(payload, true);

        return db.sequelize.transaction(async (transaction) => {
            const shift = await StudentAttendanceShift.findByPk(id, { transaction });
            ensure(shift, 'Shift RFID siswa tidak ditemukan', 'NOT_FOUND', 404);

            await shift.update(
                {
                    name: Object.prototype.hasOwnProperty.call(payload, 'name') ? payload.name : shift.name,
                    code: Object.prototype.hasOwnProperty.call(payload, 'code') ? (payload.code || null) : shift.code,
                    academic_year_id: Object.prototype.hasOwnProperty.call(payload, 'academic_year_id') ? (payload.academic_year_id || null) : shift.academic_year_id,
                    clock_in_start: Object.prototype.hasOwnProperty.call(payload, 'clock_in_start') ? payload.clock_in_start : shift.clock_in_start,
                    late_after: Object.prototype.hasOwnProperty.call(payload, 'late_after') ? payload.late_after : shift.late_after,
                    clock_in_end: Object.prototype.hasOwnProperty.call(payload, 'clock_in_end') ? payload.clock_in_end : shift.clock_in_end,
                    clock_out_start: Object.prototype.hasOwnProperty.call(payload, 'clock_out_start') ? (payload.clock_out_start || null) : shift.clock_out_start,
                    clock_out_end: Object.prototype.hasOwnProperty.call(payload, 'clock_out_end') ? (payload.clock_out_end || null) : shift.clock_out_end,
                    allow_checkout: Object.prototype.hasOwnProperty.call(payload, 'allow_checkout') ? Boolean(payload.allow_checkout) : shift.allow_checkout,
                    is_active: Object.prototype.hasOwnProperty.call(payload, 'is_active') ? Boolean(payload.is_active) : shift.is_active,
                    notes: Object.prototype.hasOwnProperty.call(payload, 'notes') ? (payload.notes || null) : shift.notes,
                    updated_by: user.id || null
                },
                { transaction }
            );

            return this.findShiftById(shift.id, { transaction });
        });
    }

    async toggleShiftActive(id, user = {}) {
        return db.sequelize.transaction(async (transaction) => {
            const shift = await StudentAttendanceShift.findByPk(id, { transaction });
            ensure(shift, 'Shift RFID siswa tidak ditemukan', 'NOT_FOUND', 404);
            await shift.update({ is_active: !shift.is_active, updated_by: user.id || null }, { transaction });
            return this.findShiftById(id, { transaction });
        });
    }

    async listClassMappings(query = {}) {
        const where = {};
        if (query.academic_year_id) where.academic_year_id = query.academic_year_id;

        return StudentAttendanceShiftClass.findAll({
            where,
            include: [
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] },
                { model: Class, as: 'class_info', attributes: ['id', 'name'] },
                { model: StudentAttendanceShift, as: 'shift', attributes: ['id', 'name', 'code', 'is_active'] },
                { model: User, as: 'creator', attributes: ['id', 'name'], required: false }
            ],
            order: [['id', 'DESC']]
        });
    }

    async upsertClassMapping(payload = {}, user = {}) {
        validateClassMappingPayload(payload);

        return db.sequelize.transaction(async (transaction) => {
            const shift = await StudentAttendanceShift.findByPk(payload.shift_id, { transaction });
            ensure(shift && shift.is_active, 'Shift tidak aktif atau tidak ditemukan', 'BUSINESS_RULE_ERROR', 422);

            const existing = await StudentAttendanceShiftClass.findOne({
                where: {
                    academic_year_id: payload.academic_year_id,
                    class_id: payload.class_id
                },
                transaction
            });

            if (existing) {
                await existing.update({ shift_id: payload.shift_id }, { transaction });
            } else {
                await StudentAttendanceShiftClass.create(
                    {
                        academic_year_id: payload.academic_year_id,
                        class_id: payload.class_id,
                        shift_id: payload.shift_id,
                        created_by: user.id || null
                    },
                    { transaction }
                );
            }

            const mapping = await StudentAttendanceShiftClass.findOne({
                where: { academic_year_id: payload.academic_year_id, class_id: payload.class_id },
                transaction
            });

            return mapping;
        });
    }

    async updateClassMapping(id, payload = {}, user = {}) {
        validateClassMappingPayload(payload);

        return db.sequelize.transaction(async (transaction) => {
            const mapping = await StudentAttendanceShiftClass.findByPk(id, { transaction });
            ensure(mapping, 'Mapping shift kelas tidak ditemukan', 'NOT_FOUND', 404);

            const shift = await StudentAttendanceShift.findByPk(payload.shift_id, { transaction });
            ensure(shift && shift.is_active, 'Shift tidak aktif atau tidak ditemukan', 'BUSINESS_RULE_ERROR', 422);

            const duplicate = await StudentAttendanceShiftClass.findOne({
                where: {
                    academic_year_id: payload.academic_year_id,
                    class_id: payload.class_id,
                    id: { [Op.ne]: id }
                },
                transaction
            });
            ensure(!duplicate, 'Mapping untuk kelas pada tahun ajaran ini sudah ada', 'BUSINESS_RULE_ERROR', 422);

            await mapping.update(
                {
                    academic_year_id: payload.academic_year_id,
                    class_id: payload.class_id,
                    shift_id: payload.shift_id,
                    created_by: mapping.created_by || user.id || null
                },
                { transaction }
            );

            return StudentAttendanceShiftClass.findByPk(id, {
                include: [
                    { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] },
                    { model: Class, as: 'class_info', attributes: ['id', 'name'] },
                    { model: StudentAttendanceShift, as: 'shift', attributes: ['id', 'name', 'code', 'is_active'] },
                    { model: User, as: 'creator', attributes: ['id', 'name'], required: false }
                ],
                transaction
            });
        });
    }

    async deleteClassMapping(id) {
        const mapping = await StudentAttendanceShiftClass.findByPk(id);
        ensure(mapping, 'Mapping shift kelas tidak ditemukan', 'NOT_FOUND', 404);
        await mapping.destroy();
        return true;
    }

    async listStudentOverrides(query = {}) {
        const where = {};
        if (query.academic_year_id) where.academic_year_id = query.academic_year_id;
        if (query.student_id) where.student_id = query.student_id;

        return StudentAttendanceShiftStudent.findAll({
            where,
            include: [
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] },
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis', 'rfid_code'] },
                { model: StudentAttendanceShift, as: 'shift', attributes: ['id', 'name', 'code', 'is_active'] },
                { model: User, as: 'creator', attributes: ['id', 'name'], required: false }
            ],
            order: [['id', 'DESC']]
        });
    }

    async upsertStudentOverride(payload = {}, user = {}) {
        validateStudentOverridePayload(payload);

        return db.sequelize.transaction(async (transaction) => {
            const shift = await StudentAttendanceShift.findByPk(payload.shift_id, { transaction });
            ensure(shift && shift.is_active, 'Shift tidak aktif atau tidak ditemukan', 'BUSINESS_RULE_ERROR', 422);

            const existing = await StudentAttendanceShiftStudent.findOne({
                where: {
                    academic_year_id: payload.academic_year_id,
                    student_id: payload.student_id
                },
                transaction
            });

            if (existing) {
                await existing.update(
                    {
                        shift_id: payload.shift_id,
                        start_date: payload.start_date || null,
                        end_date: payload.end_date || null,
                        notes: payload.notes || null
                    },
                    { transaction }
                );
                return existing;
            }

            return StudentAttendanceShiftStudent.create(
                {
                    academic_year_id: payload.academic_year_id,
                    student_id: payload.student_id,
                    shift_id: payload.shift_id,
                    start_date: payload.start_date || null,
                    end_date: payload.end_date || null,
                    notes: payload.notes || null,
                    created_by: user.id || null
                },
                { transaction }
            );
        });
    }

    async updateStudentOverride(id, payload = {}, user = {}) {
        validateStudentOverridePayload(payload);

        return db.sequelize.transaction(async (transaction) => {
            const item = await StudentAttendanceShiftStudent.findByPk(id, { transaction });
            ensure(item, 'Override shift siswa tidak ditemukan', 'NOT_FOUND', 404);

            const shift = await StudentAttendanceShift.findByPk(payload.shift_id, { transaction });
            ensure(shift && shift.is_active, 'Shift tidak aktif atau tidak ditemukan', 'BUSINESS_RULE_ERROR', 422);

            const duplicate = await StudentAttendanceShiftStudent.findOne({
                where: {
                    academic_year_id: payload.academic_year_id,
                    student_id: payload.student_id,
                    id: { [Op.ne]: id }
                },
                transaction
            });
            ensure(!duplicate, 'Override untuk siswa pada tahun ajaran ini sudah ada', 'BUSINESS_RULE_ERROR', 422);

            await item.update(
                {
                    academic_year_id: payload.academic_year_id,
                    student_id: payload.student_id,
                    shift_id: payload.shift_id,
                    start_date: payload.start_date || null,
                    end_date: payload.end_date || null,
                    notes: payload.notes || null,
                    created_by: item.created_by || user.id || null
                },
                { transaction }
            );

            return StudentAttendanceShiftStudent.findByPk(id, {
                include: [
                    { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] },
                    { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis', 'rfid_code'] },
                    { model: StudentAttendanceShift, as: 'shift', attributes: ['id', 'name', 'code', 'is_active'] },
                    { model: User, as: 'creator', attributes: ['id', 'name'], required: false }
                ],
                transaction
            });
        });
    }

    async deleteStudentOverride(id) {
        const item = await StudentAttendanceShiftStudent.findByPk(id);
        ensure(item, 'Override shift siswa tidak ditemukan', 'NOT_FOUND', 404);
        await item.destroy();
        return true;
    }
}

module.exports = new StudentAttendanceShiftService();

