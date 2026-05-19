'use strict';

const db = require('../../models');
const { DocumentSetting, SchoolProfile } = db;
const minioSvc = require('../../core/services/minio.service');

const ALLOWED_DOCUMENT_TYPES = ['GENERAL', 'PERMISSION_LETTER', 'CERTIFICATE', 'REPORT', 'MUTATION'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const IMAGE_FIELDS = {
    header_image: 'document-settings/header',
    footer_image: 'document-settings/footer',
    signature_image: 'document-settings/signature',
    stamp_image: 'document-settings/stamp',
    watermark_image: 'document-settings/watermark'
};

class DocumentSettingService {

    /**
     * List document settings with optional filters.
     */
    async findAll({ document_type, school_profile_id, is_active } = {}) {
        const where = {};
        if (document_type) where.document_type = document_type;
        if (school_profile_id) where.school_profile_id = school_profile_id;
        if (is_active !== undefined && is_active !== '') {
            where.is_active = is_active === 'true' || is_active === true;
        }

        return DocumentSetting.findAll({
            where,
            include: [{
                model: SchoolProfile,
                as: 'schoolProfile',
                attributes: ['id', 'name', 'short_name']
            }],
            order: [['updated_at', 'DESC']]
        });
    }

    /**
     * Get a single document setting by ID.
     */
    async findById(id) {
        const record = await DocumentSetting.findByPk(id, {
            include: [{
                model: SchoolProfile,
                as: 'schoolProfile',
                attributes: ['id', 'name', 'short_name']
            }]
        });
        if (!record) throw new Error('Pengaturan dokumen tidak ditemukan.');
        return record;
    }

    /**
     * Create a new document setting.
     */
    async create(data) {
        this._validateRequired(data);

        return DocumentSetting.create({
            school_profile_id: data.school_profile_id,
            document_type: data.document_type,
            signer_name: data.signer_name || null,
            signer_title: data.signer_title || null,
            signer_nip: data.signer_nip || null,
            city: data.city || null,
            letter_number_prefix: data.letter_number_prefix || null,
            letter_number_format: data.letter_number_format || null,
            default_subject: data.default_subject || null,
            default_recipient: data.default_recipient || null,
            default_cc: data.default_cc || null,
            watermark_text: data.watermark_text || null,
            pdf_footer_text: data.pdf_footer_text || null,
            show_qr_verification: Boolean(data.show_qr_verification),
            verification_base_url: data.verification_base_url || null,
            is_active: data.is_active !== undefined ? Boolean(data.is_active) : true
        });
    }

    /**
     * Update an existing document setting (non-image fields only).
     */
    async update(id, data) {
        const record = await this.findById(id);
        this._validateRequired(data);

        await record.update({
            school_profile_id: data.school_profile_id,
            document_type: data.document_type,
            signer_name: data.signer_name || null,
            signer_title: data.signer_title || null,
            signer_nip: data.signer_nip || null,
            city: data.city || null,
            letter_number_prefix: data.letter_number_prefix || null,
            letter_number_format: data.letter_number_format || null,
            default_subject: data.default_subject || null,
            default_recipient: data.default_recipient || null,
            default_cc: data.default_cc || null,
            watermark_text: data.watermark_text || null,
            pdf_footer_text: data.pdf_footer_text || null,
            show_qr_verification: Boolean(data.show_qr_verification),
            verification_base_url: data.verification_base_url || null,
            is_active: data.is_active !== undefined ? Boolean(data.is_active) : record.is_active
        });

        return record.reload();
    }

    /**
     * Toggle the is_active status.
     */
    async updateStatus(id, { is_active }) {
        const record = await this.findById(id);
        await record.update({ is_active: Boolean(is_active) });
        return record.reload();
    }

    /**
     * Upload an image asset to MinIO and update the corresponding field.
     * @param {number} id - document setting id
     * @param {string} fieldName - one of: header_image, footer_image, signature_image, stamp_image, watermark_image
     * @param {object} file - multer file object
     */
    async uploadAsset(id, fieldName, file) {
        if (!IMAGE_FIELDS[fieldName]) {
            throw new Error(`Nama field tidak valid: ${fieldName}. Field yang diizinkan: ${Object.keys(IMAGE_FIELDS).join(', ')}`);
        }

        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            throw new Error('Tipe file tidak diizinkan. Gunakan JPEG, PNG, WebP, atau SVG.');
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new Error('Ukuran file melebihi batas 5 MB.');
        }

        const record = await this.findById(id);
        const folder = IMAGE_FIELDS[fieldName];
        const publicUrl = await minioSvc.uploadFile(folder, file.originalname, file.buffer, file.mimetype);

        // Delete old file from MinIO if it exists
        const oldUrl = record[fieldName];
        if (oldUrl) {
            await minioSvc.deleteFile(oldUrl);
        }

        await record.update({ [fieldName]: publicUrl });
        return { field: fieldName, url: publicUrl };
    }

    /**
     * Validate required fields.
     */
    _validateRequired(data) {
        if (!data.school_profile_id) {
            throw new Error('Profil sekolah wajib dipilih.');
        }
        if (!data.document_type || String(data.document_type).trim() === '') {
            throw new Error('Tipe dokumen wajib dipilih.');
        }
        if (!ALLOWED_DOCUMENT_TYPES.includes(data.document_type)) {
            throw new Error(`Tipe dokumen tidak valid. Pilihan yang diizinkan: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`);
        }
        if (data.show_qr_verification && !data.verification_base_url) {
            throw new Error('URL verifikasi wajib diisi jika QR verifikasi diaktifkan.');
        }
        if (data.verification_base_url) {
            try {
                new URL(data.verification_base_url);
            } catch {
                throw new Error('Format URL verifikasi tidak valid.');
            }
        }
    }
}

module.exports = new DocumentSettingService();
