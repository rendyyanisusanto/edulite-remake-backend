'use strict';
const { Permission, Role } = require('../../models');
const { Op } = require('sequelize');

class PermissionService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 50;
        const offset = (page - 1) * limit;
        const search = query.search || '';
        const group = query.group || '';

        const where = {};
        if (search) {
            where[Op.or] = [
                { code: { [Op.like]: `%${search}%` } },
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }
        if (group) {
            // Filter by module prefix (e.g., group=student → student.*)
            where.code = { [Op.like]: `${group}.%` };
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

    async findAllGrouped() {
        const permissions = await Permission.findAll({ order: [['code', 'ASC']] });

        // Group by module prefix
        const grouped = {};
        for (const perm of permissions) {
            const parts = perm.code.split('.');
            const module = parts[0];
            if (!grouped[module]) grouped[module] = [];
            grouped[module].push(perm);
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
        const { code, name, description } = data;
        if (!code) throw Object.assign(new Error('Permission code is required'), { statusCode: 400 });
        if (!name) throw Object.assign(new Error('Permission name is required'), { statusCode: 400 });

        const existing = await Permission.findOne({ where: { code } });
        if (existing) throw Object.assign(new Error('Permission code already exists'), { statusCode: 409 });

        return await Permission.create({ code, name, description });
    }

    async update(id, data) {
        const perm = await this.findById(id);
        const { code, name, description } = data;

        if (code && code !== perm.code) {
            const existing = await Permission.findOne({ where: { code, id: { [Op.ne]: id } } });
            if (existing) throw Object.assign(new Error('Permission code already exists'), { statusCode: 409 });
        }

        return await perm.update({
            code: code || perm.code,
            name: name !== undefined ? name : perm.name,
            description: description !== undefined ? description : perm.description
        });
    }
}

module.exports = new PermissionService();
