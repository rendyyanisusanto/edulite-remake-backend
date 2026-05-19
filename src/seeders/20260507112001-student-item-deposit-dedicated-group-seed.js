'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // 1) Ensure dedicated menu group exists
    const groupName = 'Penitipan Barang Siswa';
    let [groupRows] = await queryInterface.sequelize.query(
      `SELECT id FROM menu_groups WHERE name = ${queryInterface.sequelize.escape(groupName)} LIMIT 1`
    );

    if (!groupRows.length) {
      await queryInterface.bulkInsert('menu_groups', [{
        name: groupName,
        icon: 'archive',
        sort_order: 10,
        created_at: now
      }]);
      [groupRows] = await queryInterface.sequelize.query(
        `SELECT id FROM menu_groups WHERE name = ${queryInterface.sequelize.escape(groupName)} ORDER BY id DESC LIMIT 1`
      );
    }

    const groupId = groupRows[0].id;

    // 2) Normalize submenu structure under dedicated group
    const menuDefs = [
      { name: 'Daftar Penitipan', route: '/student-item-deposits', icon: 'archive', permission: 'student_item_deposit.view', sort: 1 },
      { name: 'Monitoring Peminjaman', route: '/student-item-deposits/monitoring', icon: 'eye', permission: 'student_item_deposit.view', sort: 2 },
      { name: 'Master Kategori', route: '/student-item-deposits/categories', icon: 'list', permission: 'student_item_deposit.category.manage', sort: 3 },
      // Keep "Pengaturan" at bottom by giving very large sort value.
      { name: 'Pengaturan', route: '/student-item-deposits/settings', icon: 'settings', permission: 'student_item_deposit.setting.manage', sort: 9999 }
    ];

    const [permRows] = await queryInterface.sequelize.query(
      `SELECT id, code FROM permissions WHERE code IN (${menuDefs.map((x) => queryInterface.sequelize.escape(x.permission)).join(',')})`
    );
    const permMap = {};
    permRows.forEach((p) => { permMap[p.code] = p.id; });

    for (const item of menuDefs) {
      let [menuRows] = await queryInterface.sequelize.query(
        `SELECT id FROM menus WHERE route = ${queryInterface.sequelize.escape(item.route)} LIMIT 1`
      );
      let menuId = menuRows[0] && menuRows[0].id;

      if (menuId) {
        await queryInterface.sequelize.query(`
          UPDATE menus
          SET name = ${queryInterface.sequelize.escape(item.name)},
              group_id = ${groupId},
              parent_id = NULL,
              icon = ${queryInterface.sequelize.escape(item.icon)},
              permission_code = ${queryInterface.sequelize.escape(item.permission)},
              sort_order = ${item.sort},
              is_active = 1
          WHERE id = ${menuId}
        `);
      } else {
        await queryInterface.bulkInsert('menus', [{
          group_id: groupId,
          parent_id: null,
          name: item.name,
          route: item.route,
          icon: item.icon,
          permission_code: item.permission,
          sort_order: item.sort,
          is_active: true,
          created_at: now
        }]);
        [menuRows] = await queryInterface.sequelize.query(
          `SELECT id FROM menus WHERE route = ${queryInterface.sequelize.escape(item.route)} LIMIT 1`
        );
        menuId = menuRows[0] && menuRows[0].id;
      }

      const permissionId = permMap[item.permission];
      if (menuId && permissionId) {
        const [existingMP] = await queryInterface.sequelize.query(
          `SELECT 1 FROM menu_permissions WHERE menu_id = ${menuId} AND permission_id = ${permissionId} LIMIT 1`
        );
        if (!existingMP.length) {
          await queryInterface.bulkInsert('menu_permissions', [{ menu_id: menuId, permission_id: permissionId }]);
        }
      }
    }

    // 3) Final guard: force settings menu to always be the lowest in this group.
    await queryInterface.sequelize.query(`
      UPDATE menus
      SET sort_order = 9999
      WHERE group_id = ${groupId}
        AND route = '/student-item-deposits/settings'
    `);
  },

  async down(queryInterface) {
    // Keep data safe on rollback; only remove dedicated group if empty.
    await queryInterface.sequelize.query(`
      DELETE FROM menu_groups
      WHERE name = 'Penitipan Barang Siswa'
        AND id NOT IN (SELECT DISTINCT group_id FROM menus WHERE group_id IS NOT NULL)
    `);
  }
};
