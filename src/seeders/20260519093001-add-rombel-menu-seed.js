'use strict';

module.exports = {
    async up(queryInterface) {
        const now = new Date();
        const [groups] = await queryInterface.sequelize.query(
            "SELECT id FROM menu_groups WHERE name = 'Manajemen Siswa' LIMIT 1"
        );
        const groupId = groups[0]?.id;
        if (!groupId) return;

        const [existing] = await queryInterface.sequelize.query(
            "SELECT id FROM menus WHERE route = '/rombels' LIMIT 1"
        );
        if (existing.length > 0) return;

        await queryInterface.bulkInsert('menus', [{
            group_id: groupId,
            parent_id: null,
            name: 'Rombel',
            route: '/rombels',
            icon: 'collection',
            permission_code: 'class_assignment.view',
            sort_order: 6,
            is_active: true,
            created_at: now
        }]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('menus', { route: '/rombels' });
    }
};
