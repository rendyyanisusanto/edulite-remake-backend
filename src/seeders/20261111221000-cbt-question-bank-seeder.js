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

            // 2. Ensure Permissions for Question Bank & Question
            const perms = [
                { code: 'cbt.question_bank.view', name: 'View Bank Soal CBT' },
                { code: 'cbt.question_bank.view_all', name: 'View All Bank Soal CBT' },
                { code: 'cbt.question_bank.create', name: 'Create Bank Soal CBT' },
                { code: 'cbt.question_bank.update', name: 'Update Bank Soal CBT' },
                { code: 'cbt.question_bank.archive', name: 'Archive Bank Soal CBT' },

                { code: 'cbt.question.view', name: 'View Soal CBT' },
                { code: 'cbt.question.create', name: 'Create Soal CBT' },
                { code: 'cbt.question.update', name: 'Update Soal CBT' },
                { code: 'cbt.question.duplicate', name: 'Duplicate Soal CBT' },
                { code: 'cbt.question.archive', name: 'Archive Soal CBT' }
            ];

            const permIdsAdmin = [];
            const permIdsTeacher = [];

            for (let p of perms) {
                const [perm] = await db.Permission.findOrCreate({
                    where: { code: p.code },
                    defaults: {
                        name: p.name,
                        group: 'cbt'
                    }
                });

                permIdsAdmin.push(perm.id);
                // Assign all except view_all to teacher
                if (p.code !== 'cbt.question_bank.view_all') {
                    permIdsTeacher.push(perm.id);
                }
            }

            // 3. Ensure Menu "Bank Soal"
            await db.Menu.findOrCreate({
                where: { route: '/cbt/question-banks' },
                defaults: {
                    group_id: menuGroup.id,
                    parent_id: null, // Sibling of Dashboard and Master CBT
                    name: 'Bank Soal',
                    icon: 'lucide-book-open',
                    permission_code: 'cbt.question_bank.view',
                    sort_order: 3,
                    is_active: true
                }
            });

            // 4. Assign permissions to admin & teacher roles
            const adminRole = await db.Role.findOne({ where: { name: 'admin' } });
            if (!adminRole) {
                console.warn("Role 'admin' not found. Permissions created but not assigned to admin.");
            } else {
                for (let pid of permIdsAdmin) {
                    await db.RolePermission.findOrCreate({
                        where: { role_id: adminRole.id, permission_id: pid }
                    });
                }
            }

            // Look for teacher role (either 'teacher' or 'guru')
            const teacherRole = await db.Role.findOne({
                where: { name: { [db.Sequelize.Op.in]: ['teacher', 'guru'] } }
            });
            if (!teacherRole) {
                console.warn("Role 'teacher' or 'guru' not found. Permissions created but not assigned to teacher.");
            } else {
                for (let pid of permIdsTeacher) {
                    await db.RolePermission.findOrCreate({
                        where: { role_id: teacherRole.id, permission_id: pid }
                    });
                }
            }

            console.log("CBT Question Bank seeders successfully applied: Permissions, Menus, and Role assignment.");
        } catch (err) {
            console.error("CBT Question Bank Seeder error:", err);
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Intentionally left blank to protect data
    }
};
