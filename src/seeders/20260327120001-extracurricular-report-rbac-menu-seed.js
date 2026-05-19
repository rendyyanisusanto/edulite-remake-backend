'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        const permissionDefs = [
            ['extracurricular.report.view', 'View Extracurricular Reports', 'Lihat laporan ekstrakurikuler'],
            ['extracurricular.report.export', 'Export Extracurricular Reports', 'Export laporan ekstrakurikuler ke Excel/PDF']
        ];

        await queryInterface.bulkInsert('permissions', permissionDefs.map(([code, name, description]) => ({
            code, name, description, created_at: now
        })), { ignoreDuplicates: true });

        const [roles] = await queryInterface.sequelize.query(
            `SELECT id, name FROM roles WHERE name IN ('ADMIN','KESISWAAN','STAFF_KESISWAAN','STAFF KESISWAAN','STAFF','SUPERADMIN')`
        );
        const roleMap = {};
        roles.forEach((role) => { roleMap[role.name] = role.id; });

        const [permissions] = await queryInterface.sequelize.query(
            `SELECT id, code FROM permissions WHERE code IN ('extracurricular.report.view','extracurricular.report.export')`
        );
        const permissionMap = {};
        permissions.forEach((permission) => { permissionMap[permission.code] = permission.id; });

        const rolePermissionRows = [];
        const assign = (roleId, codes) => {
            if (!roleId) return;
            codes.forEach((code) => {
                if (permissionMap[code]) {
                    rolePermissionRows.push({
                        role_id: roleId,
                        permission_id: permissionMap[code]
                    });
                }
            });
        };

        assign(roleMap.SUPERADMIN, ['extracurricular.report.view', 'extracurricular.report.export']);
        assign(roleMap.ADMIN, ['extracurricular.report.view', 'extracurricular.report.export']);
        assign(roleMap.KESISWAAN, ['extracurricular.report.view', 'extracurricular.report.export']);
        assign(roleMap.STAFF_KESISWAAN || roleMap['STAFF KESISWAAN'] || roleMap.STAFF, ['extracurricular.report.view', 'extracurricular.report.export']);

        if (rolePermissionRows.length > 0) {
            await queryInterface.bulkInsert('role_permissions', rolePermissionRows, { ignoreDuplicates: true });
        }

        const [groupRows] = await queryInterface.sequelize.query(
            `SELECT id FROM menu_groups WHERE name = 'Ekstrakurikuler' LIMIT 1`
        );
        const groupId = groupRows[0]?.id;
        if (!groupId) return;

        await queryInterface.bulkInsert('menus', [{
            group_id: groupId,
            parent_id: null,
            name: 'Laporan Ekskul',
            route: '/extracurricular/reports',
            icon: 'document-report',
            permission_code: 'extracurricular.report.view',
            sort_order: 8,
            is_active: true,
            created_at: now
        }], { ignoreDuplicates: true });

        const [menuRows] = await queryInterface.sequelize.query(
            `SELECT id FROM menus WHERE route = '/extracurricular/reports' LIMIT 1`
        );
        const menuId = menuRows[0]?.id;
        const permissionId = permissionMap['extracurricular.report.view'];
        if (menuId && permissionId) {
            await queryInterface.bulkInsert('menu_permissions', [{
                menu_id: menuId,
                permission_id: permissionId
            }], { ignoreDuplicates: true });
        }
    },

    async down(queryInterface, Sequelize) {
        const codes = ['extracurricular.report.view', 'extracurricular.report.export'];
        await queryInterface.sequelize.query(
            `DELETE rp FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE p.code IN ('extracurricular.report.view','extracurricular.report.export')`
        );
        await queryInterface.sequelize.query(
            `DELETE mp FROM menu_permissions mp JOIN menus m ON m.id = mp.menu_id WHERE m.route = '/extracurricular/reports'`
        );
        await queryInterface.bulkDelete('menus', { route: '/extracurricular/reports' }, {});
        await queryInterface.bulkDelete('permissions', { code: codes }, {});
    }
};
