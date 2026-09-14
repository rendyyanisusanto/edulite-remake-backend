'use strict';
const minioService = require('../../core/services/minio.service');
const logger = require('../../core/logger') || console;

exports.uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah.' });
        }

        // Validate MIME type
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(req.file.mimetype)) {
            return res.status(400).json({ success: false, message: 'Format gambar tidak valid. Gunakan JPEG, PNG, atau WebP.' });
        }

        // Validating size safely (Multer configured to 5MB, but good to have double check)
        const maxSize = 5 * 1024 * 1024;
        if (req.file.size > maxSize) {
            return res.status(400).json({ success: false, message: 'Ukuran gambar maksimal 5MB.' });
        }

        const url = await minioService.uploadFile('cbt/questions', req.file.originalname, req.file.buffer, req.file.mimetype);

        res.status(201).json({
            success: true,
            message: 'Gambar berhasil diunggah',
            data: {
                url: url
            }
        });
    } catch (error) {
        if (logger.error) logger.error(`Error upload CBT image: ${error.message}`);
        next(error);
    }
};
