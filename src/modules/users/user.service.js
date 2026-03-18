'use strict';
const bcrypt = require('bcryptjs');
const { User, Role, UserRole, Permission } = require('../../models');
const { Op } = require('sequelize');

class UserService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';
        const isActive = query.is_active;

        const where = {};
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }
        if (isActive !== undefined && isActive !== '') {
            where.is_active = isActive === 'true' || isActive === true;
        }

        const { count, rows } = await User.findAndCountAll({
            where,
            attributes: { exclude: ['password_hash'] },
            include: [
                {
                    model: Role,
                    as: 'roles',
                    attributes: ['id', 'name'],
                    through: { attributes: [] }
                }
            ],
            limit,
            offset,
            order: [[query.sortBy || 'created_at', query.sortDesc === 'true' ? 'DESC' : 'ASC']],
            distinct: true
        });

        return {
            totalItems: count,
            users: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password_hash'] },
            include: [
                {
                    model: Role,
                    as: 'roles',
                    attributes: ['id', 'name', 'description'],
                    through: { attributes: [] }
                }
            ]
        });
        if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
        return user;
    }

    async create(data) {
        const { name, email, password, is_active = true } = data;

        if (!name) throw Object.assign(new Error('Name is required'), { statusCode: 400 });
        if (!email) throw Object.assign(new Error('Email is required'), { statusCode: 400 });
        if (!password) throw Object.assign(new Error('Password is required'), { statusCode: 400 });
        if (password.length < 6) throw Object.assign(new Error('Password must be at least 6 characters'), { statusCode: 400 });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) throw Object.assign(new Error('Invalid email format'), { statusCode: 400 });

        const existing = await User.findOne({ where: { email } });
        if (existing) throw Object.assign(new Error('Email already exists'), { statusCode: 409 });

        const password_hash = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password_hash, is_active });

        return await this.findById(user.id);
    }

    async update(id, data) {
        const user = await User.findByPk(id);
        if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

        const { name, email, is_active } = data;

        if (email && email !== user.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) throw Object.assign(new Error('Invalid email format'), { statusCode: 400 });

            const existing = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
            if (existing) throw Object.assign(new Error('Email already exists'), { statusCode: 409 });
        }

        await user.update({
            name: name !== undefined ? name : user.name,
            email: email !== undefined ? email : user.email,
            is_active: is_active !== undefined ? is_active : user.is_active
        });

        return await this.findById(id);
    }

    async syncRoles(userId, roleIds) {
        const user = await User.findByPk(userId);
        if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

        if (roleIds && roleIds.length > 0) {
            const roles = await Role.findAll({ where: { id: roleIds } });
            if (roles.length !== roleIds.length) {
                throw Object.assign(new Error('One or more roles not found'), { statusCode: 400 });
            }
        }

        await UserRole.destroy({ where: { user_id: userId } });

        if (roleIds && roleIds.length > 0) {
            const records = roleIds.map(rid => ({ user_id: userId, role_id: rid }));
            await UserRole.bulkCreate(records);
        }

        return await this.findById(userId);
    }

    async resetPassword(userId, data) {
        const { new_password } = data;
        if (!new_password) throw Object.assign(new Error('New password is required'), { statusCode: 400 });
        if (new_password.length < 6) throw Object.assign(new Error('Password must be at least 6 characters'), { statusCode: 400 });

        const user = await User.findByPk(userId);
        if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

        const password_hash = await bcrypt.hash(new_password, 10);
        await user.update({ password_hash });

        return { message: 'Password reset successfully' };
    }

    async toggleStatus(userId, data) {
        const user = await User.findByPk(userId);
        if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

        const is_active = data.is_active !== undefined ? data.is_active : !user.is_active;
        await user.update({ is_active });

        return await this.findById(userId);
    }

    async getUserPermissions(userId) {
        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                as: 'roles',
                include: [{
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                }],
                through: { attributes: [] }
            }]
        });
        if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

        const permSet = new Set();
        for (const role of user.roles || []) {
            if (role.name === 'SUPERADMIN') return { isSuperAdmin: true, permissions: ['*'] };
            for (const perm of role.permissions || []) {
                permSet.add(perm.code);
            }
        }

        return { isSuperAdmin: false, permissions: Array.from(permSet) };
    }
}

module.exports = new UserService();
