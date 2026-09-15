'use strict';
const { StudentLeaveRequest, Student, Class, AcademicYear, StudentClassHistory } = require('../../models');
const { Op } = require('sequelize');

class StudentLeaveRequestService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const whereCondition = {};
        if (query.status) whereCondition.status = query.status;
        if (query.leave_type) whereCondition.leave_type = query.leave_type;
        if (query.date_from) whereCondition.start_date = { [Op.gte]: query.date_from };
        if (query.date_to) whereCondition.end_date = { [Op.lte]: query.date_to };

        // For class filter
        const historyWhere = {};
        if (query.class_id) historyWhere.class_id = query.class_id;

        const { count, rows } = await StudentLeaveRequest.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'full_name', 'nis', 'nisn'],
                    required: query.class_id ? true : false,
                    include: [
                        {
                            model: StudentClassHistory,
                            as: 'class_history',
                            where: historyWhere,
                            required: query.class_id ? true : false,
                            include: [
                                { model: Class, as: 'class_info', attributes: ['name'] },
                                { model: AcademicYear, as: 'academic_year', where: { is_active: true }, required: true }
                            ]
                        }
                    ]
                }
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return {
            totalItems: count,
            studentLeaveRequests: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const record = await StudentLeaveRequest.findByPk(id, {
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'full_name', 'nis', 'nisn'],
                    include: [
                        {
                            model: StudentClassHistory,
                            as: 'class_history',
                            required: false,
                            include: [
                                { model: Class, as: 'class_info', attributes: ['name'] },
                                { model: AcademicYear, as: 'academic_year', where: { is_active: true }, required: true }
                            ]
                        }
                    ]
                }
            ]
        });
        if (!record) {
            throw new Error('Data tidak ditemukan');
        }
        return record;
    }

    async create(data) {
        if (!data.student_id || !data.leave_type || !data.start_date || !data.end_date || !data.reason || !data.attachment) {
            throw new Error('Semua field wajib diisi (student_id, leave_type, start_date, end_date, reason, attachment)');
        }
        if (new Date(data.end_date) < new Date(data.start_date)) {
            throw new Error('Tanggal selesai tidak boleh kurang dari tanggal mulai');
        }
        return await StudentLeaveRequest.create(data);
    }

    async update(id, data) {
        const record = await this.findById(id);
        if (record.status !== 'pending') {
            throw new Error('Hanya data dengan status pending yang dapat diubah');
        }
        
        if (data.start_date && data.end_date) {
            if (new Date(data.end_date) < new Date(data.start_date)) {
                throw new Error('Tanggal selesai tidak boleh kurang dari tanggal mulai');
            }
        } else if (data.start_date) {
             if (new Date(record.end_date) < new Date(data.start_date)) {
                throw new Error('Tanggal selesai tidak boleh kurang dari tanggal mulai');
            }
        } else if (data.end_date) {
             if (new Date(data.end_date) < new Date(record.start_date)) {
                throw new Error('Tanggal selesai tidak boleh kurang dari tanggal mulai');
            }
        }

        await record.update(data);
        return record;
    }

    async delete(id) {
        const record = await this.findById(id);
        if (record.status !== 'pending') {
            throw new Error('Hanya data dengan status pending yang dapat dihapus');
        }
        await record.destroy();
        return true;
    }

    async updateStatus(id, status) {
        const record = await this.findById(id);
        if (record.status !== 'pending') {
            throw new Error('Status tidak dapat diubah lagi');
        }
        if (!['approved', 'rejected'].includes(status)) {
            throw new Error('Status tidak valid');
        }
        
        await record.update({ status });
        
        // TODO: Notification logic could go here in the future
        
        return record;
    }
}

module.exports = new StudentLeaveRequestService();
