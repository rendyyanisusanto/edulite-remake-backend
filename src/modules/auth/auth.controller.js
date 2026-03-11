'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../../models');
const logger = require('../../core/logger');

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required' });
        }

        const user = await User.findOne({
            where: { email },
            include: [{ model: Role, as: 'roles' }]
        });

        if (!user || !user.is_active) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials or inactive user' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const payload = {
            id: user.id,
            email: user.email,
            roles: user.roles.map(r => r.name)
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRED || '1d' });

        await user.update({ last_login: new Date() });
        logger.info(`User login successful: ${email}`);

        res.json({
            status: 'success',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    roles: payload.roles
                }
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
            include: [{ model: Role, as: 'roles', attributes: ['id', 'name'] }]
        });

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.json({ status: 'success', data: user });
    } catch (err) {
        next(err);
    }
};
