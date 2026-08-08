'use strict';

module.exports = {
    async up(queryInterface) {
        const now = new Date();
        const perms = [
            ['tahfidz_attendance.view', 'View Tahfidz Attendance'],
            ['tahfidz_attendance.create', 'Create Tahfidz Attendance'],
            ['tahfidz_attendance.update', 'Update Tahfidz Attendance'],
            ['tahfidz_attendance.delete', 'Delete Tahfidz Attendance'],
            ['tahfidz_attendance.report', 'View Tahfidz Attendance Report']
        ];
        
        await queryInterface.bulkInsert('permissions', perms.map(([code, name]) => ({
            code, name, description: name, created_at: now
        })), { ignoreDuplicates: true });

        const [permissionRows] = await queryInterface.sequelize.query(
            `SELECT id, code FROM permissions WHERE code IN (${perms.map(([c]) => queryInterface.sequelize.escape(c)).join(',')})`
        );
        
        const permMap = {};
        permissionRows.forEach((x) => { permMap[x.code] = x.id; });

        // Assign to SUPERADMIN and ADMIN and GURU by default
        const [roles] = await queryInterface.sequelize.query("SELECT id,name FROM roles WHERE name IN ('SUPERADMIN','ADMIN','GURU')");
        const assigns = [];
        
        roles.forEach((r) => {
            // Guru can view, create, update, and report. Admin can do all.
            assigns.push({ role_id: r.id, permission_id: permMap['tahfidz_attendance.view'] });
            assigns.push({ role_id: r.id, permission_id: permMap['tahfidz_attendance.create'] });
            assigns.push({ role_id: r.id, permission_id: permMap['tahfidz_attendance.update'] });
            assigns.push({ role_id: r.id, permission_id: permMap['tahfidz_attendance.report'] });
            
            if (r.name === 'SUPERADMIN' || r.name === 'ADMIN') {
                assigns.push({ role_id: r.id, permission_id: permMap['tahfidz_attendance.delete'] });
            }
        });
        
        if (assigns.length) {
            const [existing] = await queryInterface.sequelize.query(`SELECT role_id, permission_id FROM role_permissions WHERE permission_id IN (${Object.values(permMap).join(',')})`);
            const ex = new Set(existing.map((x) => `${x.role_id}:${x.permission_id}`));
            const toInsert = assigns.filter((x) => !ex.has(`${x.role_id}:${x.permission_id}`));
            if (toInsert.length) await queryInterface.bulkInsert('role_permissions', toInsert);
        }

        // Add Menu Group "Tahfidz"
        const [groupRows] = await queryInterface.sequelize.query("SELECT id FROM menu_groups WHERE name = 'Tahfidz' LIMIT 1");
        let groupId = groupRows[0] ? groupRows[0].id : null;
        
        if (!groupId) {
            await queryInterface.bulkInsert('menu_groups', [{
                name: 'Tahfidz',
                icon: 'book',
                sort_order: 55,
                created_at: now
            }]);
            const [newGroups] = await queryInterface.sequelize.query("SELECT id FROM menu_groups WHERE name = 'Tahfidz' LIMIT 1");
            groupId = newGroups[0].id;
        }

        // Add Menus
        if (groupId) {
            const menusToAdd = [
                {
                    name: 'Absen Tahfidz',
                    route: '/tahfidz/attendance',
                    icon: 'check-square',
                    permission_code: 'tahfidz_attendance.view',
                    sort_order: 1
                },
                {
                    name: 'Rekap Tahfidz',
                    route: '/tahfidz/recap',
                    icon: 'file-text',
                    permission_code: 'tahfidz_attendance.report',
                    sort_order: 2
                }
            ];

            for (const menuData of menusToAdd) {
                const { name, route, icon, permission_code, sort_order } = menuData;
                const [menuRows] = await queryInterface.sequelize.query(`SELECT id FROM menus WHERE route=${queryInterface.sequelize.escape(route)} LIMIT 1`);
                let menuId = menuRows[0] && menuRows[0].id;
                
                if (!menuId) {
                    await queryInterface.bulkInsert('menus', [{
                        group_id: groupId, parent_id: null, name, route, icon,
                        permission_code, sort_order, is_active: true, created_at: now
                    }]);
                    const [newRows] = await queryInterface.sequelize.query(`SELECT id FROM menus WHERE route=${queryInterface.sequelize.escape(route)} LIMIT 1`);
                    menuId = newRows[0] && newRows[0].id;
                }
                
                if (menuId && permMap[permission_code]) {
                    const [mp] = await queryInterface.sequelize.query(`SELECT 1 FROM menu_permissions WHERE menu_id=${menuId} AND permission_id=${permMap[permission_code]} LIMIT 1`);
                    if (!mp.length) await queryInterface.bulkInsert('menu_permissions', [{ menu_id: menuId, permission_id: permMap[permission_code] }]);
                }
            }
        }
    },

    async down(queryInterface) {
        const codes = [
            'tahfidz_attendance.view', 'tahfidz_attendance.create', 'tahfidz_attendance.update', 
            'tahfidz_attendance.delete', 'tahfidz_attendance.report'
        ];
        
        await queryInterface.sequelize.query(`DELETE rp FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE p.code IN (${codes.map((c) => queryInterface.sequelize.escape(c)).join(',')})`);
        await queryInterface.bulkDelete('permissions', { code: codes }, {});
        await queryInterface.bulkDelete('menus', { group_id: await queryInterface.sequelize.query("SELECT id FROM menu_groups WHERE name = 'Tahfidz'").then(([r]) => r[0]?.id) }, {});
        await queryInterface.bulkDelete('menu_groups', { name: 'Tahfidz' }, {});
    }
};
