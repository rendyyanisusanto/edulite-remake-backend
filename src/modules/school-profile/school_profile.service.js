'use strict';

const db = require('../../models');
const { SchoolProfile } = db;
const minioSvc = require('../../core/services/minio.service');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Image fields that map to MinIO folder paths
const IMAGE_FIELDS = {
    logo: 'school-profile/logo',
    logo_light: 'school-profile/logo-light',
    logo_dark: 'school-profile/logo-dark',
    favicon: 'school-profile/favicon',
    school_icon: 'school-profile/school-icon'
};

class SchoolProfileService {

    /**
     * Get the singleton school profile.
     * Returns null if no profile has been created yet.
     */
    async findOne() {
        return SchoolProfile.findOne({ order: [['id', 'ASC']] });
    }

    /**
     * Create or update the school profile.
     * Validates required fields and sanitizes input.
     */
    async upsert(data) {
        if (!data.name || String(data.name).trim() === '') {
            throw new Error('Nama sekolah wajib diisi.');
        }

        // Validate email format if provided
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            throw new Error('Format email tidak valid.');
        }

        const existing = await this.findOne();

        const payload = {
            name: String(data.name).trim(),
            short_name: data.short_name || null,
            npsn: data.npsn || null,
            nss: data.nss || null,
            level: data.level || null,
            status: data.status || null,
            foundation_name: data.foundation_name || null,
            phone: data.phone || null,
            email: data.email || null,
            website: data.website || null,
            address: data.address || null,
            village: data.village || null,
            district: data.district || null,
            city: data.city || null,
            province: data.province || null,
            postal_code: data.postal_code || null,
            principal_name: data.principal_name || null,
            principal_title: data.principal_title || null,
            principal_nip: data.principal_nip || null,
            acting_principal_name: data.acting_principal_name || null,
            acting_principal_title: data.acting_principal_title || null,
            acting_principal_nip: data.acting_principal_nip || null,
            description: data.description || null
        };

        if (existing) {
            await existing.update(payload);
            return existing.reload();
        }

        return SchoolProfile.create(payload);
    }

    /**
     * Upload a single image asset to MinIO and update the corresponding field.
     * @param {string} fieldName - one of the keys of IMAGE_FIELDS
     * @param {object} file - multer file object { originalname, buffer, mimetype, size }
     */
    async uploadAsset(fieldName, file) {
        if (!IMAGE_FIELDS[fieldName]) {
            throw new Error(`Nama field tidak valid: ${fieldName}`);
        }

        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            throw new Error('Tipe file tidak diizinkan. Gunakan JPEG, PNG, WebP, SVG, atau ICO.');
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new Error('Ukuran file melebihi batas 5 MB.');
        }

        const folder = IMAGE_FIELDS[fieldName];
        const publicUrl = await minioSvc.uploadFile(folder, file.originalname, file.buffer, file.mimetype);

        // Update or create the profile record with the new URL
        const existing = await this.findOne();

        if (existing) {
            // Optionally clean up old file from MinIO
            const oldUrl = existing[fieldName];
            if (oldUrl) {
                await minioSvc.deleteFile(oldUrl);
            }
            await existing.update({ [fieldName]: publicUrl });
            return { field: fieldName, url: publicUrl };
        }

        // If no profile yet, create a placeholder row
        await SchoolProfile.create({ name: 'Sekolah', [fieldName]: publicUrl });
        return { field: fieldName, url: publicUrl };
    }
}

module.exports = new SchoolProfileService();
