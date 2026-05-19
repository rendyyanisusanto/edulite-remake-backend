const { Teacher, User } = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const minioSvc = require('../../core/services/minio.service');

const PHOTO_FOLDER = 'teachers/photos';

class TeacherService {
    _normalizeUsername(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9._-]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 50);
    }

    async _generateUniqueUsername(baseInput, excludeUserId = null) {
        const base = this._normalizeUsername(baseInput) || 'guru';
        let candidate = base;
        let counter = 1;

        while (true) {
            const where = { username: candidate };
            if (excludeUserId) where.id = { [Op.ne]: excludeUserId };
            const existing = await User.findOne({ where });
            if (!existing) return candidate;

            const suffix = `_${counter}`;
            candidate = `${base.slice(0, 50 - suffix.length)}${suffix}`;
            counter += 1;
        }
    }

    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';

        const where = {};
        if (search) {
            where[Op.or] = [
                { nip: { [Op.like]: `%${search}%` } },
                { full_name: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Teacher.findAndCountAll({
            where,
            include: [{ model: User, as: 'user', attributes: ['id', 'email', 'is_active'] }],
            limit,
            offset,
            order: [[query.sortBy || 'full_name', query.sortDesc === 'true' ? 'DESC' : 'ASC']]
        });

        return {
            totalItems: count,
            teachers: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const item = await Teacher.findByPk(id, {
            include: [{ model: User, as: 'user', attributes: ['id', 'email', 'is_active'] }]
        });
        if (!item) throw new Error('Teacher not found');
        return item;
    }

    async create(data) {
        // Create user account for teacher if email provided
        let userId = null;
        if (data.email) {
            const passwordHash = await bcrypt.hash(data.password || 'guru123', 10);
            const username = await this._generateUniqueUsername(data.email.split('@')[0] || data.full_name);
            const user = await User.create({
                name: data.full_name,
                username,
                email: data.email,
                password_hash: passwordHash,
                is_active: true
            });
            userId = user.id;

            // Assign GURU role (assuming role_id 3 is GURU based on PRD/seed)
            await user.addRoles([3]);
        }

        return await Teacher.create({
            nip: data.nip || null,
            full_name: data.full_name,
            gender: data.gender || 'L',
            phone: data.phone || null,
            position: data.position || null,
            photo: data.photo || null,
            user_id: userId
        });
    }

    async update(id, data) {
        const item = await this.findById(id);

        // Update associated user email if user exists
        if (item.user && data.email) {
            await item.user.update({ email: data.email, name: data.full_name });
            if (data.password) {
                const passwordHash = await bcrypt.hash(data.password, 10);
                await item.user.update({ password_hash: passwordHash });
            }
        }

        return await item.update({
            nip: data.nip !== undefined ? data.nip : item.nip,
            full_name: data.full_name !== undefined ? data.full_name : item.full_name,
            gender: data.gender !== undefined ? data.gender : item.gender,
            phone: data.phone !== undefined ? data.phone : item.phone,
            position: data.position !== undefined ? data.position : item.position,
            photo: data.photo !== undefined ? data.photo : item.photo
        });
    }

    async uploadPhoto(id, file) {
        const item = await this.findById(id);

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            throw new Error('Hanya file JPEG, PNG, dan WebP yang diperbolehkan');
        }

        if (file.size > 2 * 1024 * 1024) {
            throw new Error('Ukuran file maksimal 2 MB');
        }

        // Upload to Minio
        const publicUrl = await minioSvc.uploadFile(PHOTO_FOLDER, file.originalname, file.buffer, file.mimetype);

        // Delete old photo if exists
        if (item.photo) {
            await minioSvc.deleteFile(item.photo);
        }

        // Update record
        await item.update({ photo: publicUrl });

        return { url: publicUrl };
    }

    async delete(id) {
        const item = await this.findById(id);
        const userId = item.user_id;

        await item.destroy();

        // Optionally delete the user account too
        if (userId) {
            await User.destroy({ where: { id: userId } });
        }

        return true;
    }
}

module.exports = new TeacherService();
