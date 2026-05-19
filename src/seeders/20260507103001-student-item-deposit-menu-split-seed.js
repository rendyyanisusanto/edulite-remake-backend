'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const [groupRows] = await queryInterface.sequelize.query("SELECT id FROM menu_groups WHERE name = 'Kesiswaan' LIMIT 1");
    if (!groupRows.length) return;
    const groupId = groupRows[0].id;

    const routes = [
      { name: 'Penitipan Barang', route: '/student-item-deposits', icon: 'archive', permission: 'student_item_deposit.view', sort: 99 },
      { name: 'Monitoring Titipan', route: '/student-item-deposits/monitoring', icon: 'eye', permission: 'student_item_deposit.view', sort: 100 },
      { name: 'Master Kategori Titipan', route: '/student-item-deposits/categories', icon: 'list', permission: 'student_item_deposit.category.manage', sort: 101 },
      { name: 'Pengaturan Titipan', route: '/student-item-deposits/settings', icon: 'settings', permission: 'student_item_deposit.setting.manage', sort: 9999 }
    ];

    const [permRows] = await queryInterface.sequelize.query(
      `SELECT id, code FROM permissions WHERE code IN (${routes.map((x) => queryInterface.sequelize.escape(x.permission)).join(',')})`
    );
    const permMap = {};
    permRows.forEach((p) => { permMap[p.code] = p.id; });

    for (const item of routes) {
      const [existingRows] = await queryInterface.sequelize.query(`SELECT id FROM menus WHERE route = ${queryInterface.sequelize.escape(item.route)} LIMIT 1`);
      let menuId = existingRows[0] && existingRows[0].id;
      if (menuId) {
        await queryInterface.sequelize.query(`
          UPDATE menus
          SET name = ${queryInterface.sequelize.escape(item.name)}, group_id = ${groupId}, icon = ${queryInterface.sequelize.escape(item.icon)}, permission_code = ${queryInterface.sequelize.escape(item.permission)}, sort_order = ${item.sort}, is_active = 1
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
        const [newRows] = await queryInterface.sequelize.query(`SELECT id FROM menus WHERE route = ${queryInterface.sequelize.escape(item.route)} LIMIT 1`);
        menuId = newRows[0] && newRows[0].id;
      }

      const permissionId = permMap[item.permission];
      if (menuId && permissionId) {
        const [existingMP] = await queryInterface.sequelize.query(`SELECT 1 FROM menu_permissions WHERE menu_id = ${menuId} AND permission_id = ${permissionId} LIMIT 1`);
        if (!existingMP.length) {
          await queryInterface.bulkInsert('menu_permissions', [{ menu_id: menuId, permission_id: permissionId }]);
        }
      }
    }

    // Always keep settings at bottom.
    await queryInterface.sequelize.query(`
      UPDATE menus
      SET sort_order = 9999
      WHERE group_id = ${groupId}
        AND route = '/student-item-deposits/settings'
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DELETE mp FROM menu_permissions mp JOIN menus m ON m.id = mp.menu_id WHERE m.route IN ('/student-item-deposits/monitoring','/student-item-deposits/categories','/student-item-deposits/settings')`);
    await queryInterface.bulkDelete('menus', { route: ['/student-item-deposits/monitoring','/student-item-deposits/categories','/student-item-deposits/settings'] }, {});
  }
};
