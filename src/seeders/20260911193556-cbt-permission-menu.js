'use strict';
const db = require('../models');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            // 1. Ensure Menu Group "CBT"
            const [menuGroup, mgCreated] = await db.MenuGroup.findOrCreate({
                where: { name: 'CBT' },
                defaults: {
                    icon: 'lucide-monitor', // using a usual icon
                    sort_order: 10
                }
            });

            // 2. Ensure Permissions
            const perms = [
                { code: 'cbt.health.view', name: 'View CBT Health' },
                { code: 'cbt.dashboard.view', name: 'View CBT Dashboard' }
            ];

            const permIds = [];
            for (let p of perms) {
                const [perm, created] = await db.Permission.findOrCreate({
                    where: { code: p.code },
                    defaults: {
                        name: p.name,
                        group: 'cbt'
                    }
                });
                permIds.push(perm.id);
            }

            // 3. Ensure "Dashboard CBT" Menu
            const [menu, menuCreated] = await db.Menu.findOrCreate({
                where: { route: '/cbt/dashboard' },
                defaults: {
                    group_id: menuGroup.id,
                    name: 'Dashboard CBT',
                    icon: 'lucide-layout-dashboard',
                    permission_code: 'cbt.dashboard.view',
                    sort_order: 1,
                    is_active: true
                }
            });

            // 4. Assign permissions to admin role
            const adminRole = await db.Role.findOne({
                where: {
                    name: 'admin' // or try 'Admin', depends on case sensitivity in MySQL it is mostly case-insensitive
                }
            });

            if (!adminRole) {
                console.warn("Role 'admin' not found. Permissions created but not assigned to admin. Please assign manually.");
                return;
            }

            // 5. Create RolePermission relations using raw SQL or db object
            for (let pid of permIds) {
                await db.RolePermission.findOrCreate({
                    where: { role_id: adminRole.id, permission_id: pid }
                });
            }

            console.log("CBT seeders successfully applied: Menu Group, Permissions, Menu, Role assigned.");
        } catch (err) {
            console.error("CBT Seeder error:", err);
            // Wait, don't throw to break if it's already there
        }
    },

    down: async (queryInterface, Sequelize) => {
        // We intentionally don't wipe out these as it might be destructive if not careful.
    }
};
