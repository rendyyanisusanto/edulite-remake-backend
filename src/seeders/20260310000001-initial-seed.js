'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        // 1. Seed Roles
        await queryInterface.bulkInsert('roles', [
            { name: 'SUPERADMIN', description: 'System Administrator with full access' },
            { name: 'ADMIN', description: 'School Administrator' },
            { name: 'GURU', description: 'Teacher' },
            { name: 'SISWA', description: 'Student' },
            { name: 'ORTU', description: 'Parent / Guardian' }
        ], { ignoreDuplicates: true });

        // 2. Seed Permissions (Example list)
        await queryInterface.bulkInsert('permissions', [
            { code: 'users.view', name: 'View Users', description: 'Can view users', platform: 'BOTH', created_at: now },
            { code: 'users.create', name: 'Create Users', description: 'Can create users', platform: 'BOTH', created_at: now },
            { code: 'users.update', name: 'Update Users', description: 'Can update users', platform: 'BOTH', created_at: now },
            { code: 'users.delete', name: 'Delete Users', description: 'Can delete users', platform: 'BOTH', created_at: now },

            { code: 'students.view', name: 'View Students', description: 'Can view students', platform: 'BOTH', created_at: now },
            { code: 'students.create', name: 'Create Students', description: 'Can create students', platform: 'BOTH', created_at: now },
            { code: 'students.update', name: 'Update Students', description: 'Can update students', platform: 'BOTH', created_at: now },
            { code: 'students.delete', name: 'Delete Students', description: 'Can delete students', platform: 'BOTH', created_at: now }
        ], { ignoreDuplicates: true });

        // 3. Seed Superadmin User
        const passwordHash = await bcrypt.hash('password123', 10);
        await queryInterface.bulkInsert('users', [
            {
                name: 'Super Admin',
                username: 'admin',
                email: 'admin@edulite.local',
                password_hash: passwordHash,
                is_active: true,
                created_at: now,
                updated_at: now
            }
        ], { ignoreDuplicates: true });

        // 4. Assign SUPERADMIN role to Super Admin User (idempotent, no hardcoded IDs)
        const [userRows] = await queryInterface.sequelize.query(
            "SELECT id FROM users WHERE email = 'admin@edulite.local' LIMIT 1"
        );
        const [roleRows] = await queryInterface.sequelize.query(
            "SELECT id FROM roles WHERE name = 'SUPERADMIN' LIMIT 1"
        );

        const userId = userRows[0] && userRows[0].id;
        const roleId = roleRows[0] && roleRows[0].id;

        if (userId && roleId) {
            const [existing] = await queryInterface.sequelize.query(
                `SELECT 1 FROM user_roles WHERE user_id = ${userId} AND role_id = ${roleId} LIMIT 1`
            );
            if (!existing.length) {
                await queryInterface.bulkInsert('user_roles', [{ user_id: userId, role_id: roleId }]);
            }
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('user_roles', null, {});
        await queryInterface.bulkDelete('users', null, {});
        await queryInterface.bulkDelete('permissions', null, {});
        await queryInterface.bulkDelete('roles', null, {});
    }
};
