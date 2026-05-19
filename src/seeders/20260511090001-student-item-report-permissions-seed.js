'use strict';

module.exports = {
    async up(queryInterface) {
        const now = new Date();
        const perms = [
            ['student_item_deposit.report.view', 'View Student Item Deposit Reports'],
            ['student_item_deposit.report.export', 'Export Student Item Deposit Reports']
        ];
        await queryInterface.bulkInsert('permissions', perms.map(([code, name]) => ({
            code, name, description: name, created_at: now
        })), { ignoreDuplicates: true });

        const [permissionRows] = await queryInterface.sequelize.query(
            `SELECT id, code FROM permissions WHERE code IN (${perms.map(([c]) => queryInterface.sequelize.escape(c)).join(',')})`
        );
        const permMap = {};
        permissionRows.forEach((x) => { permMap[x.code] = x.id; });

        const [roles] = await queryInterface.sequelize.query("SELECT id,name FROM roles WHERE name IN ('SUPERADMIN','ADMIN','KESISWAAN','STAFF_KESISWAAN','STAFF KESISWAAN')");
        const assigns = [];
        roles.forEach((r) => {
            assigns.push({ role_id: r.id, permission_id: permMap['student_item_deposit.report.view'] });
            if (r.name === 'SUPERADMIN' || r.name === 'ADMIN') assigns.push({ role_id: r.id, permission_id: permMap['student_item_deposit.report.export'] });
        });
        if (assigns.length) {
            const [existing] = await queryInterface.sequelize.query(`SELECT role_id, permission_id FROM role_permissions WHERE permission_id IN (${Object.values(permMap).join(',')})`);
            const ex = new Set(existing.map((x) => `${x.role_id}:${x.permission_id}`));
            const toInsert = assigns.filter((x) => !ex.has(`${x.role_id}:${x.permission_id}`));
            if (toInsert.length) await queryInterface.bulkInsert('role_permissions', toInsert);
        }

        const route = '/student-item-deposits/reports';
        const [groupRows] = await queryInterface.sequelize.query("SELECT id FROM menu_groups WHERE name = 'Penitipan Barang Siswa' LIMIT 1");
        const groupId = groupRows[0] ? groupRows[0].id : null;
        if (groupId) {
            const [menuRows] = await queryInterface.sequelize.query(`SELECT id FROM menus WHERE route=${queryInterface.sequelize.escape(route)} LIMIT 1`);
            let menuId = menuRows[0] && menuRows[0].id;
            if (!menuId) {
                await queryInterface.bulkInsert('menus', [{
                    group_id: groupId, parent_id: null, name: 'Laporan Penitipan', route, icon: 'bar-chart-3',
                    permission_code: 'student_item_deposit.report.view', sort_order: 95, is_active: true, created_at: now
                }]);
                const [newRows] = await queryInterface.sequelize.query(`SELECT id FROM menus WHERE route=${queryInterface.sequelize.escape(route)} LIMIT 1`);
                menuId = newRows[0] && newRows[0].id;
            }
            if (menuId && permMap['student_item_deposit.report.view']) {
                const [mp] = await queryInterface.sequelize.query(`SELECT 1 FROM menu_permissions WHERE menu_id=${menuId} AND permission_id=${permMap['student_item_deposit.report.view']} LIMIT 1`);
                if (!mp.length) await queryInterface.bulkInsert('menu_permissions', [{ menu_id: menuId, permission_id: permMap['student_item_deposit.report.view'] }]);
            }
        }
    },

    async down(queryInterface) {
        const codes = ['student_item_deposit.report.view', 'student_item_deposit.report.export'];
        await queryInterface.sequelize.query(`DELETE rp FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE p.code IN (${codes.map((c) => queryInterface.sequelize.escape(c)).join(',')})`);
        await queryInterface.bulkDelete('permissions', { code: codes }, {});
        await queryInterface.bulkDelete('menus', { route: '/student-item-deposits/reports' }, {});
    }
};
