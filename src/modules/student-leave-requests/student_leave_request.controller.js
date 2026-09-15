'use strict';
const service = require('./student_leave_request.service');

class StudentLeaveRequestController {
    async findAll(req, res, next) {
        try {
            const result = await service.findAll(req.query);
            res.json({
                success: true,
                message: 'Data perijinan berhasil diambil',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async findById(req, res, next) {
        try {
            const result = await service.findById(req.params.id);
            res.json({
                success: true,
                message: 'Detail perijinan berhasil diambil',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const data = {
                ...req.body,
                attachment: req.file ? `/public/uploads/student_leaves/${req.file.filename}` : null
            };
            const result = await service.create(data);
            res.status(201).json({
                success: true,
                message: 'Pengajuan perijinan berhasil dibuat',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const data = { ...req.body };
            if (req.file) {
                data.attachment = `/public/uploads/student_leaves/${req.file.filename}`;
            }
            const result = await service.update(req.params.id, data);
            res.json({
                success: true,
                message: 'Pengajuan perijinan berhasil diupdate',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            await service.delete(req.params.id);
            res.json({
                success: true,
                message: 'Pengajuan perijinan berhasil dihapus',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }

    async approve(req, res, next) {
        try {
            const result = await service.updateStatus(req.params.id, 'approved');
            res.json({
                success: true,
                message: 'Perijinan disetujui',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async reject(req, res, next) {
        try {
            const result = await service.updateStatus(req.params.id, 'rejected');
            res.json({
                success: true,
                message: 'Perijinan ditolak',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new StudentLeaveRequestController();
