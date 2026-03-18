'use strict';
const { Role, Permission, User, UserRole, RolePermission } = require('../../models');
const { Op } = require('sequelize');

class RoleService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = query.search || '';

        const where = {};
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Role.findAndCountAll({
            where,
            include: [
                {
                    model: Permission,
                    as: 'permissions',
                    attributes: ['id', 'code', 'name'],
                    through: { attributes: [] }
                }
            ],
            limit,
            offset,
            order: [[query.sortBy || 'id', query.sortDesc === 'true' ? 'DESC' : 'ASC']],
            distinct: true
        });

        return {
            totalItems: count,
            roles: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const role = await Role.findByPk(id, {
            include: [
                {
                    model: Permission,
                    as: 'permissions',
                    attributes: ['id', 'code', 'name', 'description'],
                    through: { attributes: [] }
                }
            ]
        });
        if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
        return role;
    }

    async create(data) {
        const { name, description } = data;
        if (!name) throw Object.assign(new Error('Role name is required'), { statusCode: 400 });

        const existing = await Role.findOne({ where: { name: name.toUpperCase() } });
        if (existing) throw Object.assign(new Error('Role name already exists'), { statusCode: 409 });

        return await Role.create({ name: name.toUpperCase(), description });
    }

    async update(id, data) {
        const role = await this.findById(id);
        const { name, description } = data;

        if (name && name.toUpperCase() !== role.name) {
            const existing = await Role.findOne({ where: { name: name.toUpperCase(), id: { [Op.ne]: id } } });
            if (existing) throw Object.assign(new Error('Role name already exists'), { statusCode: 409 });
        }

        return await role.update({
            name: name ? name.toUpperCase() : role.name,
            description: description !== undefined ? description : role.description
        });
    }

    async delete(id) {
        const role = await this.findById(id);

        // Check if role is still used by users
        const userCount = await UserRole.count({ where: { role_id: id } });
        if (userCount > 0) {
            throw Object.assign(
                new Error(`Cannot delete role. It is assigned to ${userCount} user(s).`),
                { statusCode: 409 }
            );
        }

        // Delete role permissions first
        await RolePermission.destroy({ where: { role_id: id } });
        return await role.destroy();
    }

    async getPermissions(roleId) {
        const role = await this.findById(roleId);
        return role.permissions;
    }

    async syncPermissions(roleId, permissionIds) {
        const role = await Role.findByPk(roleId);
        if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });

        // Validate all permission IDs exist
        if (permissionIds && permissionIds.length > 0) {
            const permissions = await Permission.findAll({ where: { id: permissionIds } });
            if (permissions.length !== permissionIds.length) {
                throw Object.assign(new Error('One or more permissions not found'), { statusCode: 400 });
            }
        }

        // Delete existing and re-insert
        await RolePermission.destroy({ where: { role_id: roleId } });

        if (permissionIds && permissionIds.length > 0) {
            const records = permissionIds.map(pid => ({ role_id: roleId, permission_id: pid }));
            await RolePermission.bulkCreate(records);
        }

        return await this.findById(roleId);
    }
}

module.exports = new RoleService();
