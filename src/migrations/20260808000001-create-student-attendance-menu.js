'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // ============================================
        // 1. INSERT PERMISSIONS
        // ============================================

        // Cek permission yang sudah ada untuk menghindari duplikat
        const [permissionResults] = await queryInterface.sequelize.query(`
            SELECT code FROM permissions WHERE code IN (
                'attendance.view',
                'attendance.create',
                'attendance.update',
                'attendance.delete',
                'attendance.import'
            )
        `);

        const existingPermissions = permissionResults.map(p => p.code);
        const permissionsToInsert = [];

        // attendance.view - Melihat rekap absensi
        if (!existingPermissions.includes('attendance.view')) {
            permissionsToInsert.push({
                code: 'attendance.view',
                name: 'Lihat Absensi Siswa',
                description: 'Melihat rekap dan detail absensi siswa'
            });
        }

        // attendance.create - Membuat/input absensi baru
        if (!existingPermissions.includes('attendance.create')) {
            permissionsToInsert.push({
                code: 'attendance.create',
                name: 'Input Absensi Siswa',
                description: 'Membuat atau menginput absensi siswa manual'
            });
        }

        // attendance.update - Mengedit absensi
        if (!existingPermissions.includes('attendance.update')) {
            permissionsToInsert.push({
                code: 'attendance.update',
                name: 'Edit Absensi Siswa',
                description: 'Mengedit data absensi siswa yang sudah ada'
            });
        }

        // attendance.delete - Menghapus absensi
        if (!existingPermissions.includes('attendance.delete')) {
            permissionsToInsert.push({
                code: 'attendance.delete',
                name: 'Hapus Absensi Siswa',
                description: 'Menghapus data absensi siswa'
            });
        }

        // attendance.import - Import absensi dari file
        if (!existingPermissions.includes('attendance.import')) {
            permissionsToInsert.push({
                code: 'attendance.import',
                name: 'Import Absensi Siswa',
                description: 'Import data absensi siswa dari file Excel/CSV'
            });
        }

        // Insert permissions
        if (permissionsToInsert.length > 0) {
            await queryInterface.bulkInsert('permissions', permissionsToInsert);
        }

        // ============================================
        // 2. INSERT MENU GROUP "Absensi Siswa"
        // ============================================

        // Cek apakah menu group sudah ada
        const [menuGroupResults] = await queryInterface.sequelize.query(`
            SELECT id FROM menu_groups WHERE name = 'Absensi Siswa'
        `);

        let menuGroupId;
        if (menuGroupResults.length === 0) {
            // Insert menu group baru untuk MySQL (tanpa icon, bisa ditambah nanti lewat admin)
            await queryInterface.sequelize.query(`
                INSERT INTO menu_groups (name, sort_order, created_at)
                VALUES ('Absensi Siswa', 7, NOW())
            `);
            // Get last inserted ID
            const [insertIdResult] = await queryInterface.sequelize.query('SELECT LAST_INSERT_ID() as id');
            menuGroupId = insertIdResult[0].id;
        } else {
            menuGroupId = menuGroupResults[0].id;
        }

        // ============================================
        // 3. INSERT MENUS
        // ============================================

        // Cek sort_order yang sudah ada untuk menentukan urutan baru
        const [maxSortOrder] = await queryInterface.sequelize.query(`
            SELECT COALESCE(MAX(sort_order), 0) as max_order FROM menu_groups
        `);
        const newGroupSortOrder = maxSortOrder[0].max_order + 1;

        // Update sort_order menu group
        await queryInterface.sequelize.query(`
            UPDATE menu_groups SET sort_order = :newOrder WHERE id = :groupId
        `, {
            replacements: { newOrder: newGroupSortOrder, groupId: menuGroupId }
        });

        // Cek menus yang sudah ada
        const [existingMenus] = await queryInterface.sequelize.query(`
            SELECT route FROM menus WHERE group_id = :groupId
        `, {
            replacements: { groupId: menuGroupId }
        });

        const existingRoutes = existingMenus.map(m => m.route);
        const menusToInsert = [];

        // Menu 1: Rekap Absensi
        if (!existingRoutes.includes('/attendance/recap')) {
            menusToInsert.push({
                group_id: menuGroupId,
                name: 'Rekap Absensi',
                route: '/attendance/recap',
                permission_code: 'attendance.view',
                sort_order: 1,
                is_active: true
            });
        }

        // Menu 2: Input Absensi
        if (!existingRoutes.includes('/attendance/input')) {
            menusToInsert.push({
                group_id: menuGroupId,
                name: 'Input Absensi',
                route: '/attendance/input',
                permission_code: 'attendance.create',
                sort_order: 2,
                is_active: true
            });
        }

        // Menu 3: Import Absensi
        if (!existingRoutes.includes('/attendance/import')) {
            menusToInsert.push({
                group_id: menuGroupId,
                name: 'Import Absensi',
                route: '/attendance/import',
                permission_code: 'attendance.import',
                sort_order: 3,
                is_active: true
            });
        }

        // Insert menus
        if (menusToInsert.length > 0) {
            await queryInterface.bulkInsert('menus', menusToInsert);
        }

        // ============================================
        // 4. ASSIGN PERMISSIONS TO ROLES
        // ============================================

        // Assign permissions to SUPERADMIN role (biasanya id = 1)
        // Cek dulu role SUPERADMIN
        const [superAdminRole] = await queryInterface.sequelize.query(`
            SELECT id FROM roles WHERE name = 'SUPERADMIN' LIMIT 1
        `);

        if (superAdminRole.length > 0) {
            const superAdminRoleId = superAdminRole[0].id;

            // Cek permissions yang perlu ditambahkan ke SUPERADMIN
            const [existingRolePermissions] = await queryInterface.sequelize.query(`
                SELECT p.code
                FROM role_permissions rp
                JOIN permissions p ON rp.permission_id = p.id
                WHERE rp.role_id = :roleId
                AND p.code IN ('attendance.view', 'attendance.create', 'attendance.update', 'attendance.delete', 'attendance.import')
            `, {
                replacements: { roleId: superAdminRoleId }
            });

            const existingRolePermCodes = existingRolePermissions.map(p => p.code);
            const rolePermissionsToInsert = [];

            // Get permission IDs
            const [permissionIds] = await queryInterface.sequelize.query(`
                SELECT id, code FROM permissions WHERE code IN (
                    'attendance.view',
                    'attendance.create',
                    'attendance.update',
                    'attendance.delete',
                    'attendance.import'
                )
            `);

            for (const perm of permissionIds) {
                if (!existingRolePermCodes.includes(perm.code)) {
                    rolePermissionsToInsert.push({
                        role_id: superAdminRoleId,
                        permission_id: perm.id
                    });
                }
            }

            // Insert role permissions
            if (rolePermissionsToInsert.length > 0) {
                await queryInterface.bulkInsert('role_permissions', rolePermissionsToInsert);
            }
        }
    },

    async down(queryInterface, Sequelize) {
        // Rollback: Hapus menus dan permissions yang dibuat

        // Hapus menus
        await queryInterface.sequelize.query(`
            DELETE FROM menus WHERE route IN (
                '/attendance/recap',
                '/attendance/input',
                '/attendance/import'
            )
        `);

        // Hapus menu group
        await queryInterface.sequelize.query(`
            DELETE FROM menu_groups WHERE name = 'Absensi Siswa'
        `);

        // Hapus role_permissions untuk permissions ini
        await queryInterface.sequelize.query(`
            DELETE FROM role_permissions WHERE permission_id IN (
                SELECT id FROM permissions WHERE code IN (
                    'attendance.view',
                    'attendance.create',
                    'attendance.update',
                    'attendance.delete',
                    'attendance.import'
                )
            )
        `);

        // Hapus permissions
        await queryInterface.sequelize.query(`
            DELETE FROM permissions WHERE code IN (
                'attendance.view',
                'attendance.create',
                'attendance.update',
                'attendance.delete',
                'attendance.import'
            )
        `);
    }
};
