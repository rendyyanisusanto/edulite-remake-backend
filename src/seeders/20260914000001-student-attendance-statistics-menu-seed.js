'use strict';

module.exports = {
    async up(queryInterface) {
        const now = new Date();
        
        // Find group "Absensi Siswa"
        const [groupRows] = await queryInterface.sequelize.query("SELECT id FROM menu_groups WHERE name = 'Absensi Siswa' LIMIT 1");
        const groupId = groupRows[0] ? groupRows[0].id : null;
        
        if (groupId) {
            const menuData = { 
                name: 'Laporan dan Statistik', 
                route: '/attendance/statistics', 
                icon: 'pie-chart', 
                permission_code: 'attendance.view', 
                sort_order: 4 
            };

            const [menuRows] = await queryInterface.sequelize.query(`SELECT id FROM menus WHERE route='${menuData.route}' LIMIT 1`);
            
            if (!menuRows[0]) {
                await queryInterface.bulkInsert('menus', [{
                    group_id: groupId,
                    parent_id: null,
                    name: menuData.name,
                    route: menuData.route,
                    icon: menuData.icon,
                    permission_code: menuData.permission_code,
                    sort_order: menuData.sort_order,
                    is_active: true,
                    created_at: now
                }]);

                const [newMenuRows] = await queryInterface.sequelize.query(`SELECT id FROM menus WHERE route='${menuData.route}' LIMIT 1`);
                const newMenuId = newMenuRows[0].id;

                const [permRows] = await queryInterface.sequelize.query(`SELECT id FROM permissions WHERE code='${menuData.permission_code}' LIMIT 1`);
                if (permRows[0]) {
                    const permId = permRows[0].id;
                    await queryInterface.bulkInsert('menu_permissions', [{
                        menu_id: newMenuId,
                        permission_id: permId
                    }]);
                }
            }
        }
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`DELETE FROM menus WHERE route = '/attendance/statistics'`);
    }
};
