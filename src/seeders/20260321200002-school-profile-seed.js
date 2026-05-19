'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        // 1. Insert new permissions
        const newPermissions = [
            { code: 'setting.school_profile.view', name: 'View School Profile', description: 'View school profile settings page', created_at: now },
            { code: 'setting.school_profile.update', name: 'Update School Profile', description: 'Edit and save school profile', created_at: now }
        ];
        await queryInterface.bulkInsert('permissions', newPermissions, { ignoreDuplicates: true });

        // 2. Fetch IDs needed
        const [roles] = await queryInterface.sequelize.query(
            `SELECT id, name FROM roles WHERE name IN ('SUPERADMIN','ADMIN')`
        );
        const roleMap = {};
        for (const r of roles) roleMap[r.name] = r.id;

        const [perms] = await queryInterface.sequelize.query(
            `SELECT id, code FROM permissions WHERE code IN ('setting.school_profile.view','setting.school_profile.update')`
        );
        const permMap = {};
        for (const p of perms) permMap[p.code] = p.id;

        // 3. Assign permissions to SUPERADMIN and ADMIN
        const rpRecords = [];
        for (const roleName of ['SUPERADMIN', 'ADMIN']) {
            const roleId = roleMap[roleName];
            if (!roleId) continue;
            for (const code of ['setting.school_profile.view', 'setting.school_profile.update']) {
                const permId = permMap[code];
                if (permId) rpRecords.push({ role_id: roleId, permission_id: permId });
            }
        }
        if (rpRecords.length > 0) {
            await queryInterface.bulkInsert('role_permissions', rpRecords, { ignoreDuplicates: true });
        }

        // 4. Find or create the "Sistem" menu group
        const [existingGroups] = await queryInterface.sequelize.query(
            `SELECT id, name FROM menu_groups WHERE name = 'Sistem' LIMIT 1`
        );
        let sistemGroupId = existingGroups[0]?.id;

        if (!sistemGroupId) {
            await queryInterface.bulkInsert('menu_groups', [
                { name: 'Sistem', icon: 'cog', sort_order: 7, created_at: now }
            ], { ignoreDuplicates: true });
            const [newGroup] = await queryInterface.sequelize.query(
                `SELECT id FROM menu_groups WHERE name = 'Sistem' LIMIT 1`
            );
            sistemGroupId = newGroup[0]?.id;
        }

        if (!sistemGroupId) return; // safeguard

        // 5. Add "Profil Sekolah" menu item under Sistem group
        await queryInterface.bulkInsert('menus', [{
            group_id: sistemGroupId,
            parent_id: null,
            name: 'Profil Sekolah',
            route: '/school-profile',
            icon: 'office-building',
            permission_code: 'setting.school_profile.view',
            sort_order: 10,
            is_active: true,
            created_at: now
        }], { ignoreDuplicates: true });

        // 6. Link menu to permission
        const [menuRows] = await queryInterface.sequelize.query(
            `SELECT id FROM menus WHERE route = '/school-profile' LIMIT 1`
        );
        const menuId = menuRows[0]?.id;
        const permId = permMap['setting.school_profile.view'];

        if (menuId && permId) {
            await queryInterface.bulkInsert('menu_permissions', [
                { menu_id: menuId, permission_id: permId }
            ], { ignoreDuplicates: true });
        }
    },

    async down(queryInterface, Sequelize) {
        // Remove menu_permissions
        await queryInterface.sequelize.query(
            `DELETE mp FROM menu_permissions mp
             JOIN menus m ON m.id = mp.menu_id
             WHERE m.route = '/school-profile'`
        );
        // Remove menu
        await queryInterface.bulkDelete('menus', { route: '/school-profile' }, {});
        // Remove role_permissions
        await queryInterface.sequelize.query(
            `DELETE rp FROM role_permissions rp
             JOIN permissions p ON p.id = rp.permission_id
             WHERE p.code IN ('setting.school_profile.view','setting.school_profile.update')`
        );
        // Remove permissions
        await queryInterface.bulkDelete('permissions', {
            code: ['setting.school_profile.view', 'setting.school_profile.update']
        }, {});
    }
};
