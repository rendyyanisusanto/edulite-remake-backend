'use strict';
const { Permission, Role } = require('../../models');
const { Op } = require('sequelize');

class PermissionService {
    normalizePlatform(platform) {
        if (!platform) return '';
        const value = String(platform).trim().toUpperCase();
        return ['WEB', 'MOBILE', 'BOTH'].includes(value) ? value : '';
    }

    buildPlatformWhere(query = {}) {
        const platform = this.normalizePlatform(query.platform);
        const includeBoth = String(query.include_both || 'true').toLowerCase() !== 'false';

        if (!platform) return null;
        if (includeBoth) return { [Op.in]: [platform, 'BOTH'] };
        return platform;
    }

    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 50;
        const offset = (page - 1) * limit;
        const search = query.search || '';
        const group = query.group || query.module || '';

        const where = {};
        if (search) {
            where[Op.or] = [
                { code: { [Op.like]: `%${search}%` } },
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }
        if (group) {
            where.code = { [Op.like]: `${group}.%` };
        }

        const platformWhere = this.buildPlatformWhere(query);
        if (platformWhere) {
            where.platform = platformWhere;
        }

        const { count, rows } = await Permission.findAndCountAll({
            where,
            limit,
            offset,
            order: [['code', 'ASC']]
        });

        return {
            totalItems: count,
            permissions: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async findAllGrouped(query = {}) {
        const where = {};
        const platformWhere = this.buildPlatformWhere(query);
        if (platformWhere) {
            where.platform = platformWhere;
        }

        const permissions = await Permission.findAll({
            where,
            order: [['code', 'ASC']]
        });

        const grouped = {};
        for (const perm of permissions) {
            const parts = perm.code.split('.');
            const moduleName = parts[0];
            if (!grouped[moduleName]) grouped[moduleName] = [];
            grouped[moduleName].push(perm);
        }

        return Object.entries(grouped).map(([module, items]) => ({ module, permissions: items }));
    }

    async findById(id) {
        const perm = await Permission.findByPk(id, {
            include: [{ model: Role, as: 'roles', attributes: ['id', 'name'], through: { attributes: [] } }]
        });
        if (!perm) throw Object.assign(new Error('Permission not found'), { statusCode: 404 });
        return perm;
    }

    async create(data) {
        const { code, name, description, platform } = data;
        const normalizedPlatform = this.normalizePlatform(platform) || 'BOTH';

        if (!code) throw Object.assign(new Error('Permission code is required'), { statusCode: 400 });
        if (!name) throw Object.assign(new Error('Permission name is required'), { statusCode: 400 });

        const existing = await Permission.findOne({ where: { code } });
        if (existing) throw Object.assign(new Error('Permission code already exists'), { statusCode: 409 });

        return await Permission.create({ code, name, description, platform: normalizedPlatform });
    }

    async update(id, data) {
        const perm = await this.findById(id);
        const { code, name, description, platform } = data;

        if (code && code !== perm.code) {
            const existing = await Permission.findOne({ where: { code, id: { [Op.ne]: id } } });
            if (existing) throw Object.assign(new Error('Permission code already exists'), { statusCode: 409 });
        }

        const normalizedPlatform = platform !== undefined ? this.normalizePlatform(platform) : perm.platform;
        if (platform !== undefined && !normalizedPlatform) {
            throw Object.assign(new Error('Invalid platform. Allowed values: WEB, MOBILE, BOTH'), { statusCode: 400 });
        }

        return await perm.update({
            code: code || perm.code,
            name: name !== undefined ? name : perm.name,
            description: description !== undefined ? description : perm.description,
            platform: normalizedPlatform || perm.platform
        });
    }
}

module.exports = new PermissionService();
