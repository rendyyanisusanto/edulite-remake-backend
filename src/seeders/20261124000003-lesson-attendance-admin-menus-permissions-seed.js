'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // 1. Idempotent permissions (platform = WEB)
    const permissions = [
      {
        code: 'lesson_attendance.monitoring.view',
        name: 'View Lesson Attendance Monitoring',
        description: 'Melihat halaman monitoring presensi jam pelajaran',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.data.view',
        name: 'View Lesson Attendance Data',
        description: 'Melihat daftar dan detail transaksi presensi jam pelajaran',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.data.create',
        name: 'Create Manual Lesson Attendance',
        description: 'Input presensi jam pelajaran secara manual oleh administrator',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.data.correct',
        name: 'Correct Lesson Attendance',
        description: 'Mengoreksi data transaksi presensi jam pelajaran',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.data.cancel',
        name: 'Cancel Lesson Attendance',
        description: 'Membatalkan transaksi presensi jam pelajaran',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.data.restore',
        name: 'Restore Lesson Attendance',
        description: 'Memulihkan transaksi presensi jam pelajaran yang dibatalkan',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.data.audit',
        name: 'View Lesson Attendance Audit Trail',
        description: 'Melihat riwayat perubahan dan audit trail transaksi presensi jam pelajaran',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.report.view',
        name: 'View Lesson Attendance Reports',
        description: 'Melihat laporan presensi jam pelajaran',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.report.export_excel',
        name: 'Export Lesson Attendance Excel',
        description: 'Mengunduh laporan presensi jam pelajaran dalam format Excel',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.report.export_pdf',
        name: 'Export Lesson Attendance PDF',
        description: 'Mengunduh laporan presensi jam pelajaran dalam format PDF',
        platform: 'WEB'
      }
    ];

    for (const perm of permissions) {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM permissions WHERE code = :code LIMIT 1',
        { replacements: { code: perm.code } }
      );
      if (existing.length === 0) {
        await queryInterface.bulkInsert('permissions', [{ ...perm, created_at: now }]);
      }
    }

    const [permRows] = await queryInterface.sequelize.query(
      'SELECT id, code FROM permissions WHERE code IN (:codes)',
      { replacements: { codes: permissions.map((p) => p.code) } }
    );
    const permMap = new Map(permRows.map((p) => [p.code, p.id]));

    // 2. Assign permissions to SUPERADMIN and ADMIN roles (idempotent, no hardcoded role IDs)
    const [adminRoles] = await queryInterface.sequelize.query(
      "SELECT id, name FROM roles WHERE LOWER(name) IN ('superadmin', 'super admin', 'admin')"
    );

    for (const role of adminRoles) {
      for (const perm of permRows) {
        const [exists] = await queryInterface.sequelize.query(
          'SELECT id FROM role_permissions WHERE role_id = :roleId AND permission_id = :permId LIMIT 1',
          { replacements: { roleId: role.id, permId: perm.id } }
        );
        if (exists.length === 0) {
          await queryInterface.bulkInsert('role_permissions', [
            { role_id: role.id, permission_id: perm.id }
          ]);
        }
      }
    }

    // 3. Independent Menu Group: "Presensi Jam Pelajaran" (adjacent to Absensi Siswa)
    const groupName = 'Presensi Jam Pelajaran';
    const [groupRows] = await queryInterface.sequelize.query(
      'SELECT id FROM menu_groups WHERE name = :name LIMIT 1',
      { replacements: { name: groupName } }
    );

    let groupId = groupRows[0]?.id || null;
    if (!groupId) {
      // Place immediately after Absensi Siswa if present, otherwise sort_order 10002
      const [absensiSiswaRows] = await queryInterface.sequelize.query(
        "SELECT sort_order FROM menu_groups WHERE name = 'Absensi Siswa' LIMIT 1"
      );
      const targetSortOrder = absensiSiswaRows[0]?.sort_order
        ? Number(absensiSiswaRows[0].sort_order) + 1
        : 10002;

      await queryInterface.bulkInsert('menu_groups', [{
        name: groupName,
        icon: 'clipboard-check',
        sort_order: targetSortOrder,
        created_at: now
      }]);

      const [createdGroup] = await queryInterface.sequelize.query(
        'SELECT id FROM menu_groups WHERE name = :name LIMIT 1',
        { replacements: { name: groupName } }
      );
      groupId = createdGroup[0].id;
    }

    // 4. Three independent submenus under "Presensi Jam Pelajaran"
    const submenus = [
      {
        name: 'Monitoring',
        route: '/presensi-jam-pelajaran/monitoring',
        icon: 'monitor',
        permission_code: 'lesson_attendance.monitoring.view',
        sort_order: 1
      },
      {
        name: 'Data Presensi',
        route: '/presensi-jam-pelajaran/data',
        icon: 'clipboard-list',
        permission_code: 'lesson_attendance.data.view',
        sort_order: 2
      },
      {
        name: 'Laporan Presensi',
        route: '/presensi-jam-pelajaran/laporan',
        icon: 'file-bar-chart',
        permission_code: 'lesson_attendance.report.view',
        sort_order: 3
      }
    ];

    for (const item of submenus) {
      const [existingMenu] = await queryInterface.sequelize.query(
        'SELECT id, group_id, parent_id FROM menus WHERE route = :route LIMIT 1',
        { replacements: { route: item.route } }
      );

      let menuId = existingMenu[0]?.id || null;
      if (!menuId) {
        await queryInterface.bulkInsert('menus', [{
          group_id: groupId,
          parent_id: null,
          name: item.name,
          route: item.route,
          icon: item.icon,
          permission_code: item.permission_code,
          sort_order: item.sort_order,
          is_active: true,
          created_at: now
        }]);

        const [insertedMenu] = await queryInterface.sequelize.query(
          'SELECT id FROM menus WHERE route = :route LIMIT 1',
          { replacements: { route: item.route } }
        );
        menuId = insertedMenu[0].id;
      } else {
        // Safely ensure it belongs to the independent Presensi Jam Pelajaran group
        await queryInterface.sequelize.query(
          `UPDATE menus
           SET group_id = :groupId, parent_id = NULL, name = :name, icon = :icon,
               permission_code = :permissionCode, sort_order = :sortOrder, is_active = 1
           WHERE id = :menuId`,
          {
            replacements: {
              groupId,
              name: item.name,
              icon: item.icon,
              permissionCode: item.permission_code,
              sortOrder: item.sort_order,
              menuId
            }
          }
        );
      }

      const permId = permMap.get(item.permission_code);
      if (menuId && permId) {
        const [mpExists] = await queryInterface.sequelize.query(
          'SELECT id FROM menu_permissions WHERE menu_id = :menuId AND permission_id = :permId LIMIT 1',
          { replacements: { menuId, permId } }
        );
        if (mpExists.length === 0) {
          await queryInterface.bulkInsert('menu_permissions', [{
            menu_id: menuId,
            permission_id: permId
          }]);
        }
      }
    }
  },

  async down(queryInterface) {
    const routes = [
      '/presensi-jam-pelajaran/monitoring',
      '/presensi-jam-pelajaran/data',
      '/presensi-jam-pelajaran/laporan'
    ];
    const codes = [
      'lesson_attendance.monitoring.view',
      'lesson_attendance.data.view',
      'lesson_attendance.data.create',
      'lesson_attendance.data.correct',
      'lesson_attendance.data.cancel',
      'lesson_attendance.data.restore',
      'lesson_attendance.data.audit',
      'lesson_attendance.report.view',
      'lesson_attendance.report.export_excel',
      'lesson_attendance.report.export_pdf'
    ];

    const [menuRows] = await queryInterface.sequelize.query(
      'SELECT id FROM menus WHERE route IN (:routes)',
      { replacements: { routes } }
    );
    const menuIds = menuRows.map((m) => m.id);
    if (menuIds.length > 0) {
      await queryInterface.sequelize.query(
        'DELETE FROM menu_permissions WHERE menu_id IN (:menuIds)',
        { replacements: { menuIds } }
      );
      await queryInterface.sequelize.query(
        'DELETE FROM menus WHERE id IN (:menuIds)',
        { replacements: { menuIds } }
      );
    }

    await queryInterface.sequelize.query(
      "DELETE FROM menu_groups WHERE name = 'Presensi Jam Pelajaran'"
    );

    const [permRows] = await queryInterface.sequelize.query(
      'SELECT id FROM permissions WHERE code IN (:codes)',
      { replacements: { codes } }
    );
    const permIds = permRows.map((p) => p.id);
    if (permIds.length > 0) {
      await queryInterface.sequelize.query(
        'DELETE FROM role_permissions WHERE permission_id IN (:permIds)',
        { replacements: { permIds } }
      );
      await queryInterface.sequelize.query(
        'DELETE FROM permissions WHERE id IN (:permIds)',
        { replacements: { permIds } }
      );
    }
  }
};
