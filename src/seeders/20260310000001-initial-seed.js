'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Seed Roles
        await queryInterface.bulkInsert('roles', [
            { name: 'SUPERADMIN', description: 'System Administrator with full access' },
            { name: 'ADMIN', description: 'School Administrator' },
            { name: 'GURU', description: 'Teacher' },
            { name: 'SISWA', description: 'Student' },
            { name: 'ORTU', description: 'Parent / Guardian' }
        ]);

        // 2. Seed Permissions (Example list)
        await queryInterface.bulkInsert('permissions', [
            { code: 'users.view', name: 'View Users', description: 'Can view users', created_at: new Date() },
            { code: 'users.create', name: 'Create Users', description: 'Can create users', created_at: new Date() },
            { code: 'users.update', name: 'Update Users', description: 'Can update users', created_at: new Date() },
            { code: 'users.delete', name: 'Delete Users', description: 'Can delete users', created_at: new Date() },

            { code: 'students.view', name: 'View Students', description: 'Can view students', created_at: new Date() },
            { code: 'students.create', name: 'Create Students', description: 'Can create students', created_at: new Date() },
            { code: 'students.update', name: 'Update Students', description: 'Can update students', created_at: new Date() },
            { code: 'students.delete', name: 'Delete Students', description: 'Can delete students', created_at: new Date() }
        ]);

        // 3. Seed Superadmin User
        const passwordHash = await bcrypt.hash('password123', 10);
        await queryInterface.bulkInsert('users', [
            {
                name: 'Super Admin',
                email: 'admin@edulite.local',
                password_hash: passwordHash,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);

        // 4. Assign SUPERADMIN role to Super Admin User
        await queryInterface.bulkInsert('user_roles', [
            {
                user_id: 1, // Because we just inserted the first user
                role_id: 1  // SUPERADMIN role
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('user_roles', null, {});
        await queryInterface.bulkDelete('users', null, {});
        await queryInterface.bulkDelete('permissions', null, {});
        await queryInterface.bulkDelete('roles', null, {});
    }
};
