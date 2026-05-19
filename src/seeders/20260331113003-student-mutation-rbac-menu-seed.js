'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const now = new Date();

        const permissionDefs = [
            ['student.mutation.view', 'View Student Mutation', 'Lihat data mutasi siswa'],
            ['student.mutation.create', 'Create Student Mutation', 'Buat data mutasi siswa'],
            ['student.mutation.update', 'Update Student Mutation', 'Ubah data mutasi siswa'],
            ['student.mutation.submit', 'Submit Student Mutation', 'Ajukan data mutasi siswa'],
            ['student.mutation.approve', 'Approve Student Mutation', 'Setujui mutasi siswa'],
            ['student.mutation.reject', 'Reject Student Mutation', 'Tolak mutasi siswa'],
            ['student.mutation.complete', 'Complete Student Mutation', 'Finalisasi mutasi siswa'],
            ['student.mutation.cancel', 'Cancel Student Mutation', 'Batalkan proses mutasi siswa'],
            ['student.mutation.print', 'Print Student Mutation', 'Cetak dokumen mutasi siswa'],
            ['student.mutation.report', 'Report Student Mutation', 'Lihat laporan mutasi siswa']
        ];

        await queryInterface.bulkInsert('permissions', permissionDefs.map(([code, name, description]) => ({
            code,
            name,
            description,
            created_at: now
        })), { ignoreDuplicates: true });

        const [roles] = await queryInterface.sequelize.query(
            `SELECT id, name FROM roles WHERE name IN ('SUPERADMIN','ADMIN','KESISWAAN','STAFF_KESISWAAN','STAFF KESISWAAN','GURU')`
        );
        const roleMap = {};
        roles.forEach((role) => { roleMap[role.name] = role.id; });

        const [permissions] = await queryInterface.sequelize.query(
            `SELECT id, code FROM permissions WHERE code LIKE 'student.mutation.%'`
        );
        const permissionMap = {};
        permissions.forEach((permission) => { permissionMap[permission.code] = permission.id; });

        const allCodes = permissionDefs.map((item) => item[0]);
        const staffCodes = [
            'student.mutation.view',
            'student.mutation.create',
            'student.mutation.update',
            'student.mutation.submit',
            'student.mutation.report'
        ];
        const guruCodes = [
            'student.mutation.view',
            'student.mutation.report'
        ];

        const buildRolePermissionRows = (roleId, codes) => {
            if (!roleId) return [];
            return codes
                .filter((code) => permissionMap[code])
                .map((code) => ({ role_id: roleId, permission_id: permissionMap[code] }));
        };

        const rolePermissionRows = [
            ...buildRolePermissionRows(roleMap.SUPERADMIN, allCodes),
            ...buildRolePermissionRows(roleMap.ADMIN, allCodes),
            ...buildRolePermissionRows(roleMap.KESISWAAN, allCodes),
            ...buildRolePermissionRows(roleMap.STAFF_KESISWAAN || roleMap['STAFF KESISWAAN'], staffCodes),
            ...buildRolePermissionRows(roleMap.GURU, guruCodes)
        ];

        if (rolePermissionRows.length > 0) {
            await queryInterface.bulkInsert('role_permissions', rolePermissionRows, { ignoreDuplicates: true });
        }

        const [groupRows] = await queryInterface.sequelize.query(
            `SELECT id FROM menu_groups WHERE name = 'Manajemen Siswa' LIMIT 1`
        );
        const groupId = groupRows[0]?.id;
        if (!groupId) return;

        await queryInterface.bulkInsert('menus', [
            {
                group_id: groupId,
                parent_id: null,
                name: 'Mutasi Siswa',
                route: '/transfers',
                icon: 'switch-horizontal',
                permission_code: 'student.mutation.view',
                sort_order: 6,
                is_active: true,
                created_at: now
            }
        ], { ignoreDuplicates: true });

        const [menuRows] = await queryInterface.sequelize.query(
            `SELECT id, permission_code FROM menus WHERE route = '/transfers' LIMIT 1`
        );
        const menu = menuRows[0];
        if (!menu) return;

        if (menu.permission_code !== 'student.mutation.view') {
            await queryInterface.sequelize.query(
                `UPDATE menus SET permission_code = 'student.mutation.view' WHERE id = ${menu.id}`
            );
        }

        const permissionId = permissionMap['student.mutation.view'];
        if (permissionId) {
            await queryInterface.bulkInsert('menu_permissions', [{
                menu_id: menu.id,
                permission_id: permissionId
            }], { ignoreDuplicates: true });
        }
    },

    async down(queryInterface) {
        const codes = [
            'student.mutation.view',
            'student.mutation.create',
            'student.mutation.update',
            'student.mutation.submit',
            'student.mutation.approve',
            'student.mutation.reject',
            'student.mutation.complete',
            'student.mutation.cancel',
            'student.mutation.print',
            'student.mutation.report'
        ];

        await queryInterface.sequelize.query(
            `DELETE rp FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE p.code IN (${codes.map((code) => `'${code}'`).join(',')})`
        );
        await queryInterface.sequelize.query(
            `DELETE mp FROM menu_permissions mp JOIN menus m ON m.id = mp.menu_id WHERE m.permission_code = 'student.mutation.view'`
        );
        await queryInterface.bulkDelete('permissions', { code: codes }, {});
    }
};
