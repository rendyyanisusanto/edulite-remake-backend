'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../../models');
const logger = require('../../core/logger');

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({
            where: { email },
            include: [{
                model: Role,
                as: 'roles',
                include: [{
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                }]
            }]
        });

        if (!user || !user.is_active) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or inactive user' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Collect permissions
        let isSuperAdmin = false;
        const permSet = new Set();
        for (const role of user.roles || []) {
            if (role.name === 'SUPERADMIN') { isSuperAdmin = true; break; }
            for (const perm of role.permissions || []) {
                permSet.add(perm.code);
            }
        }
        const permissions = isSuperAdmin ? ['*'] : Array.from(permSet);

        const payload = {
            id: user.id,
            email: user.email,
            roles: user.roles.map(r => r.name)
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRED || '1d' });

        await user.update({ last_login: new Date() });
        logger.info(`User login successful: ${email}`);

        res.json({
            success: true,
            data: {
                access_token: token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    is_active: user.is_active
                },
                roles: payload.roles,
                permissions
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.profile = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'email', 'is_active', 'last_login', 'created_at'],
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'name'],
                include: [{
                    model: Permission,
                    as: 'permissions',
                    attributes: ['id', 'code', 'name'],
                    through: { attributes: [] }
                }]
            }]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Collect permissions
        let isSuperAdmin = false;
        const permSet = new Set();
        for (const role of user.roles || []) {
            if (role.name === 'SUPERADMIN') { isSuperAdmin = true; break; }
            for (const perm of role.permissions || []) {
                permSet.add(perm.code);
            }
        }
        const permissions = isSuperAdmin ? ['*'] : Array.from(permSet);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    is_active: user.is_active,
                    last_login: user.last_login,
                    created_at: user.created_at
                },
                roles: user.roles.map(r => r.name),
                permissions
            }
        });
    } catch (err) {
        next(err);
    }
};
