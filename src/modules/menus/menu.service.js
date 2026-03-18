'use strict';
const { Menu, MenuGroup, Permission, Role, User, MenuPermission } = require('../../models');
const { Op } = require('sequelize');

class MenuService {
    /**
     * Get all menus with groups (for admin management)
     */
    async findAll() {
        const groups = await MenuGroup.findAll({
            include: [
                {
                    model: Menu,
                    as: 'menus',
                    where: { parent_id: null },
                    required: false,
                    include: [
                        {
                            model: Menu,
                            as: 'submenus',
                            include: [
                                {
                                    model: Permission,
                                    as: 'permissions',
                                    through: { attributes: [] }
                                }
                            ]
                        },
                        {
                            model: Permission,
                            as: 'permissions',
                            through: { attributes: [] }
                        }
                    ]
                }
            ],
            order: [
                ['sort_order', 'ASC'],
                [{ model: Menu, as: 'menus' }, 'sort_order', 'ASC'],
                [{ model: Menu, as: 'menus' }, { model: Menu, as: 'submenus' }, 'sort_order', 'ASC']
            ]
        });
        return groups;
    }

    /**
     * Get dynamic menu for a specific user based on their permissions
     */
    async getMenuForUser(userId) {
        // Get user with roles and permissions
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

        // Collect all permission codes
        let isSuperAdmin = false;
        const permSet = new Set();
        for (const role of user.roles || []) {
            if (role.name === 'SUPERADMIN') { isSuperAdmin = true; break; }
            for (const perm of role.permissions || []) {
                permSet.add(perm.code);
            }
        }

        // Get all active menus with groups
        const groups = await MenuGroup.findAll({
            include: [
                {
                    model: Menu,
                    as: 'menus',
                    where: { is_active: true, parent_id: null },
                    required: false,
                    include: [
                        {
                            model: Menu,
                            as: 'submenus',
                            where: { is_active: true },
                            required: false
                        }
                    ]
                }
            ],
            order: [
                ['sort_order', 'ASC'],
                [{ model: Menu, as: 'menus' }, 'sort_order', 'ASC'],
                [{ model: Menu, as: 'menus' }, { model: Menu, as: 'submenus' }, 'sort_order', 'ASC']
            ]
        });

        // Filter menus based on permissions
        const filteredGroups = [];
        for (const group of groups) {
            const filteredMenus = [];
            for (const menu of group.menus || []) {
                // Check if user has permission for this menu
                const hasMenuAccess = isSuperAdmin || !menu.permission_code || permSet.has(menu.permission_code);
                if (!hasMenuAccess) continue;

                // Filter submenus
                const filteredSubmenus = (menu.submenus || []).filter(sub => {
                    return isSuperAdmin || !sub.permission_code || permSet.has(sub.permission_code);
                });

                // Include menu if it has access (with filtered submenus)
                filteredMenus.push({
                    ...menu.toJSON(),
                    submenus: filteredSubmenus
                });
            }

            if (filteredMenus.length > 0) {
                filteredGroups.push({
                    ...group.toJSON(),
                    menus: filteredMenus
                });
            }
        }

        return filteredGroups;
    }

    /**
     * Update menu active status
     */
    async toggleMenuStatus(menuId, is_active) {
        const menu = await Menu.findByPk(menuId);
        if (!menu) throw Object.assign(new Error('Menu not found'), { statusCode: 404 });
        return await menu.update({ is_active });
    }

    /**
     * Update menu permission
     */
    async updateMenuPermission(menuId, permissionCode) {
        const menu = await Menu.findByPk(menuId);
        if (!menu) throw Object.assign(new Error('Menu not found'), { statusCode: 404 });
        return await menu.update({ permission_code: permissionCode });
    }
}

module.exports = new MenuService();
