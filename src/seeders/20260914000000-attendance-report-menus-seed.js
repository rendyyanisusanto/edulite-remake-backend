'use strict';

module.exports = {
    async up(queryInterface) {
        const now = new Date();
        
        // 1. Create permission
        const perms = [
            ['attendance_report.view', 'View Attendance Report']
        ];
        
        await queryInterface.bulkInsert('permissions', perms.map(([code, name]) => ({
            code, name, description: name, created_at: now
        })), { ignoreDuplicates: true });

        const [permissionRows] = await queryInterface.sequelize.query(
            `SELECT id, code FROM permissions WHERE code IN (${perms.map(([c]) => queryInterface.sequelize.escape(c)).join(',')})`
        );
        
        const permMap = {};
        permissionRows.forEach((x) => { permMap[x.code] = x.id; });

        // Assign to SUPERADMIN and ADMIN
        const [roles] = await queryInterface.sequelize.query("SELECT id,name FROM roles WHERE name IN ('SUPERADMIN','ADMIN')");
        const assigns = [];
        roles.forEach((r) => {
            assigns.push({ role_id: r.id, permission_id: permMap['attendance_report.view'] });
        });
        
        if (assigns.length) {
            const [existing] = await queryInterface.sequelize.query(`SELECT role_id, permission_id FROM role_permissions WHERE permission_id IN (${Object.values(permMap).join(',')})`);
            const ex = new Set(existing.map((x) => `${x.role_id}:${x.permission_id}`));
            const toInsert = assigns.filter((x) => !ex.has(`${x.role_id}:${x.permission_id}`));
            if (toInsert.length) await queryInterface.bulkInsert('role_permissions', toInsert);
        }

        // Add Menu Group "Laporan Presensi Siswa"
        const [groupRows] = await queryInterface.sequelize.query("SELECT id FROM menu_groups WHERE name = 'Laporan Presensi Siswa' LIMIT 1");
        let groupId = groupRows[0] ? groupRows[0].id : null;
        
        if (!groupId) {
            await queryInterface.bulkInsert('menu_groups', [{
                name: 'Laporan Presensi Siswa',
                icon: 'file-text',
                sort_order: 90,
                created_at: now
            }]);
            const [newGroups] = await queryInterface.sequelize.query("SELECT id FROM menu_groups WHERE name = 'Laporan Presensi Siswa' LIMIT 1");
            groupId = newGroups[0].id;
        }

        // Add Parent Menu "Laporan Absensi"
        let parentMenuId = null;
        if (groupId) {
            const [parentRows] = await queryInterface.sequelize.query(`SELECT id FROM menus WHERE name='Laporan Absensi' AND group_id=${groupId} LIMIT 1`);
            parentMenuId = parentRows[0] && parentRows[0].id;

            if (!parentMenuId) {
                await queryInterface.bulkInsert('menus', [{
                    group_id: groupId, parent_id: null, name: 'Laporan Absensi', route: null, icon: 'bar-chart-2',
                    permission_code: 'attendance_report.view', sort_order: 1, is_active: true, created_at: now
                }]);
                const [newRows] = await queryInterface.sequelize.query(`SELECT id FROM menus WHERE name='Laporan Absensi' AND group_id=${groupId} LIMIT 1`);
                parentMenuId = newRows[0] && newRows[0].id;
            }
        }

        // Add Child Menus
        if (groupId && parentMenuId) {
            const menusToAdd = [
                { name: 'Dashboard Absensi', route: '/attendance-report/dashboard', icon: 'layout', sort_order: 1 },
                { name: 'Rekap Absensi', route: '/attendance-report/recap', icon: 'list', sort_order: 2 },
                { name: 'Keterlambatan', route: '/attendance-report/lateness', icon: 'clock', sort_order: 3 },
                { name: 'Ketidakhadiran', route: '/attendance-report/absence', icon: 'user-x', sort_order: 4 },
                { name: 'Per Siswa', route: '/attendance-report/student', icon: 'user', sort_order: 5 },
                { name: 'Per Kelas', route: '/attendance-report/class', icon: 'users', sort_order: 6 },
                { name: 'Siswa Berisiko', route: '/attendance-report/at-risk', icon: 'alert-triangle', sort_order: 7 },
            ];

            for (const menuData of menusToAdd) {
                const { name, route, icon, sort_order } = menuData;
                const [menuRows] = await queryInterface.sequelize.query(`SELECT id FROM menus WHERE route=${queryInterface.sequelize.escape(route)} LIMIT 1`);
                let menuId = menuRows[0] && menuRows[0].id;
                
                if (!menuId) {
                    await queryInterface.bulkInsert('menus', [{
                        group_id: groupId, parent_id: parentMenuId, name, route, icon,
                        permission_code: 'attendance_report.view', sort_order, is_active: true, created_at: now
                    }]);
                }
            }
        }
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`DELETE FROM menus WHERE permission_code = 'attendance_report.view'`);
        await queryInterface.sequelize.query(`DELETE FROM menu_groups WHERE name = 'Laporan Presensi Siswa'`);
        await queryInterface.sequelize.query(`DELETE rp FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE p.code = 'attendance_report.view'`);
        await queryInterface.sequelize.query(`DELETE FROM permissions WHERE code = 'attendance_report.view'`);
    }
};
