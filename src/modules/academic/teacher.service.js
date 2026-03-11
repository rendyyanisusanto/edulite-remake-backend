const { Teacher, User } = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

class TeacherService {
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
            const user = await User.create({
                name: data.full_name,
                email: data.email,
                password_hash: passwordHash,
                is_active: true
            });
            userId = user.id;

            // Assign GURU role (assuming role_id 3 is GURU based on PRD/seed)
            await user.addRoles([3]);
        }

        return await Teacher.create({
            ...data,
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

        return await item.update(data);
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
