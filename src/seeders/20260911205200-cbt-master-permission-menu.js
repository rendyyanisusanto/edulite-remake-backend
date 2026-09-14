'use strict';
const db = require('../models');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            // 1. Ensure Menu Group "CBT" exists
            const menuGroup = await db.MenuGroup.findOne({
                where: { name: 'CBT' }
            });

            if (!menuGroup) {
                console.warn("Menu Group 'CBT' not found. Please run the previous seeder first.");
                return;
            }

            // 2. Ensure Permissions
            const perms = [
                { code: 'cbt.master.teacher_assignment.view', name: 'View Penugasan Guru' },
                { code: 'cbt.master.teacher_assignment.create', name: 'Create Penugasan Guru' },
                { code: 'cbt.master.teacher_assignment.update', name: 'Update Penugasan Guru' },
                { code: 'cbt.master.teacher_assignment.delete', name: 'Delete Penugasan Guru' },
                { code: 'cbt.master.student_account.view', name: 'View Akun Peserta' },
                { code: 'cbt.master.student_account.create', name: 'Create Akun Peserta' },
                { code: 'cbt.master.student_account.reset_password', name: 'Reset Password Akun Peserta' },
                { code: 'cbt.master.student_account.change_status', name: 'Change Status Akun Peserta' }
            ];

            const permIds = [];
            for (let p of perms) {
                const [perm] = await db.Permission.findOrCreate({
                    where: { code: p.code },
                    defaults: {
                        name: p.name,
                        group: 'cbt'
                    }
                });
                permIds.push(perm.id);
            }

            // 3. Ensure Parent Menu "Master CBT"
            const [parentMenu] = await db.Menu.findOrCreate({
                where: { name: 'Master CBT', group_id: menuGroup.id },
                defaults: {
                    icon: 'lucide-database',
                    // Note: If no route, it acts as a collapsible parent
                    route: null,
                    permission_code: 'cbt.master.teacher_assignment.view',
                    sort_order: 2,
                    is_active: true
                }
            });

            // 4. Ensure Child Menu "Penugasan Guru"
            await db.Menu.findOrCreate({
                where: { route: '/cbt/master/teacher-assignments' },
                defaults: {
                    group_id: menuGroup.id,
                    parent_id: parentMenu.id,
                    name: 'Penugasan Guru',
                    icon: 'lucide-users-round',
                    permission_code: 'cbt.master.teacher_assignment.view',
                    sort_order: 1,
                    is_active: true
                }
            });

            // 5. Ensure Child Menu "Akun Peserta"
            await db.Menu.findOrCreate({
                where: { route: '/cbt/master/student-accounts' },
                defaults: {
                    group_id: menuGroup.id,
                    parent_id: parentMenu.id,
                    name: 'Akun Peserta',
                    icon: 'lucide-user-cog',
                    permission_code: 'cbt.master.student_account.view',
                    sort_order: 2,
                    is_active: true
                }
            });

            // 6. Assign permissions to admin role
            const adminRole = await db.Role.findOne({
                where: { name: 'admin' }
            });

            if (!adminRole) {
                console.warn("Role 'admin' not found. Permissions created but not assigned to admin.");
                return;
            }

            // 7. Create RolePermission relations
            for (let pid of permIds) {
                await db.RolePermission.findOrCreate({
                    where: { role_id: adminRole.id, permission_id: pid }
                });
            }

            console.log("CBT Master seeders successfully applied: Permissions, Menus, and Role assignment.");
        } catch (err) {
            console.error("CBT Master Seeder error:", err);
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Intentionally not wiping out automatically to prevent destructive un-seeding
    }
};
