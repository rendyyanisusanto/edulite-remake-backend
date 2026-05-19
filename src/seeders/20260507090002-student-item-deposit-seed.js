'use strict';

module.exports = {
    async up(queryInterface) {
        const now = new Date();

        const categories = ['HP', 'Laptop', 'Tablet', 'Charger', 'Powerbank', 'Uang Tunai', 'Lainnya'];
        await queryInterface.bulkInsert('student_item_categories', categories.map((name) => ({
            name,
            description: null,
            is_active: true,
            created_at: now,
            updated_at: now
        })), { ignoreDuplicates: true });

        const permissionDefs = [
            ['student_item_deposit.view', 'View Student Item Deposit'],
            ['student_item_deposit.create', 'Create Student Item Deposit'],
            ['student_item_deposit.update', 'Update Student Item Deposit'],
            ['student_item_deposit.loan', 'Loan Student Item Deposit'],
            ['student_item_deposit.return_daily', 'Return Daily Student Item Deposit'],
            ['student_item_deposit.final_return', 'Final Return Student Item Deposit'],
            ['student_item_deposit.cancel', 'Cancel Student Item Deposit'],
            ['student_item_deposit.print', 'Print Student Item Deposit'],
            ['student_item_deposit.category.manage', 'Manage Student Item Category'],
            ['student_item_deposit.kiosk_access', 'Kiosk Access Student Item Deposit'],
            ['student_item_deposit.setting.manage', 'Manage Student Item Deposit Setting']
        ];

        await queryInterface.bulkInsert('permissions', permissionDefs.map(([code, name]) => ({
            code,
            name,
            description: name,
            created_at: now
        })), { ignoreDuplicates: true });

        const [roleRows] = await queryInterface.sequelize.query(
            "SELECT id, name FROM roles WHERE name IN ('SUPERADMIN','ADMIN','KESISWAAN','STAFF_KESISWAAN','STAFF KESISWAAN')"
        );
        const roleMap = {};
        roleRows.forEach((r) => { roleMap[r.name] = r.id; });

        const [permissionRowsAll] = await queryInterface.sequelize.query(
            `SELECT id, code FROM permissions WHERE code IN (${permissionDefs.map(([code]) => queryInterface.sequelize.escape(code)).join(',')})`
        );
        const permMap = {};
        permissionRowsAll.forEach((p) => { permMap[p.code] = p.id; });

        const assign = [];
        const addRolePerm = (roleId, codes) => {
            if (!roleId) return;
            codes.forEach((code) => {
                if (permMap[code]) assign.push({ role_id: roleId, permission_id: permMap[code] });
            });
        };

        const allCodes = permissionDefs.map(([code]) => code);
        const opsCodes = [
            'student_item_deposit.view',
            'student_item_deposit.create',
            'student_item_deposit.update',
            'student_item_deposit.loan',
            'student_item_deposit.return_daily',
            'student_item_deposit.final_return',
            'student_item_deposit.cancel',
            'student_item_deposit.print',
            'student_item_deposit.kiosk_access'
        ];

        addRolePerm(roleMap.SUPERADMIN, allCodes);
        addRolePerm(roleMap.ADMIN, allCodes);
        addRolePerm(roleMap.KESISWAAN, opsCodes);
        addRolePerm(roleMap.STAFF_KESISWAAN || roleMap['STAFF KESISWAAN'], opsCodes);

        if (assign.length) {
            const roleIds = [...new Set(assign.map((x) => x.role_id))];
            const permIds = [...new Set(assign.map((x) => x.permission_id))];
            const [existing] = await queryInterface.sequelize.query(
                `SELECT role_id, permission_id FROM role_permissions WHERE role_id IN (${roleIds.join(',')}) AND permission_id IN (${permIds.join(',')})`
            );
            const existsSet = new Set(existing.map((x) => `${x.role_id}:${x.permission_id}`));
            const toInsert = assign.filter((x) => !existsSet.has(`${x.role_id}:${x.permission_id}`));
            if (toInsert.length) {
                await queryInterface.bulkInsert('role_permissions', toInsert);
            }
        }

        const [groupRows] = await queryInterface.sequelize.query("SELECT id FROM menu_groups WHERE name = 'Kesiswaan' LIMIT 1");
        let groupId = groupRows[0] && groupRows[0].id;

        if (!groupId) {
            await queryInterface.bulkInsert('menu_groups', [{
                name: 'Kesiswaan',
                icon: 'users',
                sort_order: 7,
                created_at: now
            }]);

            const [newGroupRows] = await queryInterface.sequelize.query("SELECT id FROM menu_groups WHERE name = 'Kesiswaan' ORDER BY id DESC LIMIT 1");
            groupId = newGroupRows[0] && newGroupRows[0].id;
        }

        const menuDefs = [
            { name: 'Penitipan Barang', route: '/student-item-deposits', icon: 'archive', permission: 'student_item_deposit.view', sort: 99 },
            { name: 'Monitoring Titipan', route: '/student-item-deposits/monitoring', icon: 'eye', permission: 'student_item_deposit.view', sort: 100 },
            { name: 'Master Kategori Titipan', route: '/student-item-deposits/categories', icon: 'list', permission: 'student_item_deposit.category.manage', sort: 101 },
            { name: 'Pengaturan Titipan', route: '/student-item-deposits/settings', icon: 'settings', permission: 'student_item_deposit.setting.manage', sort: 102 }
        ];

        for (const def of menuDefs) {
            const [menuRows] = await queryInterface.sequelize.query(`SELECT id FROM menus WHERE route = ${queryInterface.sequelize.escape(def.route)} LIMIT 1`);
            let menuId = menuRows[0] && menuRows[0].id;
            if (menuId) {
                await queryInterface.sequelize.query(`
                    UPDATE menus
                    SET name = ${queryInterface.sequelize.escape(def.name)}, group_id = ${groupId}, icon = ${queryInterface.sequelize.escape(def.icon)}, permission_code = ${queryInterface.sequelize.escape(def.permission)}, is_active = 1, sort_order = ${def.sort}
                    WHERE id = ${menuId}
                `);
            } else {
                await queryInterface.bulkInsert('menus', [{
                    group_id: groupId,
                    parent_id: null,
                    name: def.name,
                    route: def.route,
                    icon: def.icon,
                    permission_code: def.permission,
                    sort_order: def.sort,
                    is_active: true,
                    created_at: now
                }]);
                const [newMenuRows] = await queryInterface.sequelize.query(`SELECT id FROM menus WHERE route = ${queryInterface.sequelize.escape(def.route)} LIMIT 1`);
                menuId = newMenuRows[0] && newMenuRows[0].id;
            }

            const permissionId = permMap[def.permission];
            if (menuId && permissionId) {
                const [existingMenuPerm] = await queryInterface.sequelize.query(`SELECT 1 FROM menu_permissions WHERE menu_id = ${menuId} AND permission_id = ${permissionId} LIMIT 1`);
                if (!existingMenuPerm.length) {
                    await queryInterface.bulkInsert('menu_permissions', [{ menu_id: menuId, permission_id: permissionId }]);
                }
            }
        }
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('student_item_categories', {
            name: ['HP', 'Laptop', 'Tablet', 'Charger', 'Powerbank', 'Uang Tunai', 'Lainnya']
        }, {});

        const codes = [
            'student_item_deposit.view',
            'student_item_deposit.create',
            'student_item_deposit.update',
            'student_item_deposit.loan',
            'student_item_deposit.return_daily',
            'student_item_deposit.final_return',
            'student_item_deposit.cancel',
            'student_item_deposit.print',
            'student_item_deposit.category.manage',
            'student_item_deposit.kiosk_access',
            'student_item_deposit.setting.manage'
        ];

        await queryInterface.sequelize.query(`DELETE rp FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE p.code IN (${codes.map((c) => queryInterface.sequelize.escape(c)).join(',')})`);
        await queryInterface.sequelize.query(`DELETE mp FROM menu_permissions mp JOIN menus m ON m.id = mp.menu_id WHERE m.route IN ('/student-item-deposits','/student-item-deposits/monitoring','/student-item-deposits/categories','/student-item-deposits/settings')`);
        await queryInterface.bulkDelete('menus', { route: ['/student-item-deposits','/student-item-deposits/monitoring','/student-item-deposits/categories','/student-item-deposits/settings'] }, {});
        await queryInterface.bulkDelete('permissions', { code: codes }, {});
    }
};
