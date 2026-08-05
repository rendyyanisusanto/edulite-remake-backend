'use strict';

module.exports = {
    async up(queryInterface) {
        const now = new Date();

        const permissions = [
            ['subject.view', 'Lihat Mata Pelajaran', 'Melihat daftar mata pelajaran'],
            ['subject.create', 'Tambah Mata Pelajaran', 'Menambah mata pelajaran'],
            ['subject.update', 'Ubah Mata Pelajaran', 'Mengubah data mata pelajaran'],
            ['subject.toggle_active', 'Aktif Nonaktif Mata Pelajaran', 'Mengaktifkan atau menonaktifkan mata pelajaran'],
            ['subject.delete', 'Hapus Mata Pelajaran', 'Menghapus data mata pelajaran jika aman'],
            ['lesson_period_template.view', 'Lihat Template Jam Pelajaran', 'Melihat template jam pelajaran'],
            ['lesson_period_template.create', 'Tambah Template Jam Pelajaran', 'Menambah template jam pelajaran'],
            ['lesson_period_template.update', 'Ubah Template Jam Pelajaran', 'Mengubah template jam pelajaran'],
            ['lesson_period_template.toggle_active', 'Aktif Nonaktif Template Jam Pelajaran', 'Mengaktifkan atau menonaktifkan template jam pelajaran'],
            ['lesson_period.view', 'Lihat Detail Jam Pelajaran', 'Melihat detail jam pelajaran'],
            ['lesson_period.create', 'Tambah Detail Jam Pelajaran', 'Menambah detail jam pelajaran'],
            ['lesson_period.update', 'Ubah Detail Jam Pelajaran', 'Mengubah detail jam pelajaran'],
            ['lesson_period.toggle_active', 'Aktif Nonaktif Detail Jam Pelajaran', 'Mengaktifkan atau menonaktifkan detail jam pelajaran'],
            ['lesson_period.delete', 'Hapus Detail Jam Pelajaran', 'Menghapus detail jam pelajaran jika aman']
        ];

        for (const [code, name, description] of permissions) {
            await queryInterface.sequelize.query(
                `INSERT INTO permissions (code, name, description, created_at)
                 SELECT :code, :name, :description, :createdAt
                 WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = :code)`,
                { replacements: { code, name, description, createdAt: now } }
            );
        }

        const [groups] = await queryInterface.sequelize.query(
            "SELECT id FROM menu_groups WHERE name = 'Akademik' LIMIT 1"
        );
        const groupId = groups[0]?.id;
        if (!groupId) return;

        const menus = [
            { name: 'Mata Pelajaran', route: '/subjects', icon: 'book-open', permission_code: 'subject.view', sort_order: 6 },
            { name: 'Jam Pelajaran', route: '/lesson-periods', icon: 'clock', permission_code: 'lesson_period_template.view', sort_order: 7 }
        ];

        for (const menu of menus) {
            await queryInterface.sequelize.query(
                `INSERT INTO menus (group_id, parent_id, name, route, icon, permission_code, sort_order, is_active, created_at)
                 SELECT :group_id, NULL, :name, :route, :icon, :permission_code, :sort_order, 1, :createdAt
                 WHERE NOT EXISTS (SELECT 1 FROM menus WHERE route = :route)`,
                { replacements: { ...menu, group_id: groupId, createdAt: now } }
            );
        }

        const [permissionRows] = await queryInterface.sequelize.query(
            "SELECT id, code FROM permissions WHERE code IN ('subject.view','lesson_period_template.view')"
        );
        const permissionMap = {};
        permissionRows.forEach((row) => { permissionMap[row.code] = row.id; });

        const [menuRows] = await queryInterface.sequelize.query(
            "SELECT id, permission_code FROM menus WHERE route IN ('/subjects','/lesson-periods')"
        );

        for (const menu of menuRows) {
            const permissionId = permissionMap[menu.permission_code];
            if (!permissionId) continue;
            await queryInterface.sequelize.query(
                `INSERT INTO menu_permissions (menu_id, permission_id)
                 SELECT :menu_id, :permission_id
                 WHERE NOT EXISTS (
                   SELECT 1 FROM menu_permissions WHERE menu_id = :menu_id AND permission_id = :permission_id
                 )`,
                { replacements: { menu_id: menu.id, permission_id: permissionId } }
            );
        }
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            "DELETE mp FROM menu_permissions mp INNER JOIN menus m ON m.id = mp.menu_id WHERE m.route IN ('/subjects','/lesson-periods')"
        );
        await queryInterface.bulkDelete('menus', { route: ['/subjects', '/lesson-periods'] });
        await queryInterface.bulkDelete('permissions', {
            code: [
                'subject.view', 'subject.create', 'subject.update', 'subject.toggle_active', 'subject.delete',
                'lesson_period_template.view', 'lesson_period_template.create', 'lesson_period_template.update', 'lesson_period_template.toggle_active',
                'lesson_period.view', 'lesson_period.create', 'lesson_period.update', 'lesson_period.toggle_active', 'lesson_period.delete'
            ]
        });
    }
};
