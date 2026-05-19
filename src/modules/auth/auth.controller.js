'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, Permission, Teacher, ExtracurricularCoach } = require('../../models');
const logger = require('../../core/logger');

const PLATFORM_WEB = 'WEB';
const PLATFORM_MOBILE = 'MOBILE';
const PLATFORM_BOTH = 'BOTH';

function resolveClientPlatform(req) {
    const raw = String(req.query?.platform || req.headers['x-client-platform'] || '').trim().toUpperCase();
    if (raw === 'WEB') return PLATFORM_WEB;
    if (raw === 'MOBILE') return PLATFORM_MOBILE;
    return '';
}

function isPermissionAllowedForPlatform(permission, clientPlatform) {
    if (!clientPlatform) return true;
    const permissionPlatform = String(permission?.platform || PLATFORM_BOTH).toUpperCase();
    if (permissionPlatform === PLATFORM_BOTH) return true;
    return permissionPlatform === clientPlatform;
}

function buildPermissionsFromRoles(roles = [], clientPlatform = '') {
    let isSuperAdmin = false;
    const permSet = new Set();

    for (const role of roles) {
        if (role.name === 'SUPERADMIN') {
            isSuperAdmin = true;
            break;
        }

        for (const perm of role.permissions || []) {
            if (isPermissionAllowedForPlatform(perm, clientPlatform)) {
                permSet.add(perm.code);
            }
        }
    }

    return isSuperAdmin ? ['*'] : Array.from(permSet);
}

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const clientPlatform = resolveClientPlatform(req);

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        const user = await User.findOne({
            where: { username },
            include: [{
                model: Role,
                as: 'roles',
                include: [{
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                }]
            }, {
                model: Teacher,
                as: 'teacher_profile',
                attributes: ['id', 'photo']
            }, {
                model: ExtracurricularCoach,
                as: 'extracurricular_coach_profile',
                attributes: ['id', 'photo'],
                required: false
            }]
        });

        if (!user || !user.is_active) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or inactive user' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const permissions = buildPermissionsFromRoles(user.roles || [], clientPlatform);

        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            roles: user.roles.map(r => r.name)
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRED || '1d' });

        await user.update({ last_login: new Date() });
        logger.info(`User login successful: ${username}`);

        res.json({
            success: true,
            data: {
                access_token: token,
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    is_active: user.is_active,
                    photo: user.teacher_profile?.photo || user.extracurricular_coach_profile?.photo || null
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
        const clientPlatform = resolveClientPlatform(req);
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'username', 'email', 'is_active', 'last_login', 'created_at'],
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'name'],
                include: [{
                    model: Permission,
                    as: 'permissions',
                    attributes: ['id', 'code', 'name', 'platform'],
                    through: { attributes: [] }
                }]
            }, {
                model: Teacher,
                as: 'teacher_profile',
                attributes: ['id', 'photo']
            }, {
                model: ExtracurricularCoach,
                as: 'extracurricular_coach_profile',
                attributes: ['id', 'photo'],
                required: false
            }]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const permissions = buildPermissionsFromRoles(user.roles || [], clientPlatform);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    is_active: user.is_active,
                    last_login: user.last_login,
                    created_at: user.created_at,
                    photo: user.teacher_profile?.photo || user.extracurricular_coach_profile?.photo || null
                },
                roles: user.roles.map(r => r.name),
                permissions
            }
        });
    } catch (err) {
        next(err);
    }
};
