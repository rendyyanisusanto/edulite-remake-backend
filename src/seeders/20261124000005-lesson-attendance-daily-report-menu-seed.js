'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // 1. Idempotent permissions (platform = WEB)
    const permissions = [
      {
        code: 'lesson_attendance.daily_report.view',
        name: 'View Daily Student Lesson Attendance Report',
        description: 'Melihat laporan harian presensi siswa per jam pelajaran dan indikasi bolos',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.daily_report.export_excel',
        name: 'Export Daily Student Lesson Attendance Excel',
        description: 'Mengunduh laporan harian presensi siswa per jam pelajaran dalam format Excel',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.daily_report.export_pdf',
        name: 'Export Daily Student Lesson Attendance PDF',
        description: 'Mengunduh laporan harian presensi siswa per jam pelajaran dalam format PDF',
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

    // 2. Assign to SUPERADMIN, ADMIN, KESISWAAN, STAFF_KESISWAAN, TATIB (by role name, never hardcoded ID)
    const [targetRoles] = await queryInterface.sequelize.query(
      "SELECT id, name FROM roles WHERE LOWER(name) IN ('superadmin', 'super admin', 'admin', 'kesiswaan', 'staff_kesiswaan', 'tatib')"
    );

    for (const role of targetRoles) {
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

    // 3. Find existing "Presensi Jam Pelajaran" menu group
    const [groupRows] = await queryInterface.sequelize.query(
      "SELECT id FROM menu_groups WHERE name = 'Presensi Jam Pelajaran' LIMIT 1"
    );
    if (groupRows.length === 0) {
      throw new Error('Menu group "Presensi Jam Pelajaran" tidak ditemukan. Jalankan seeder LA-04 terlebih dahulu.');
    }
    const groupId = groupRows[0].id;

    // Ensure "Laporan Presensi" has sort_order = 4 so "Laporan Harian Siswa" sits at sort_order = 3
    await queryInterface.sequelize.query(
      "UPDATE menus SET sort_order = 4 WHERE group_id = :groupId AND route = '/presensi-jam-pelajaran/laporan'",
      { replacements: { groupId } }
    );

    // 4. Insert/update "Laporan Harian Siswa" submenu
    const route = '/presensi-jam-pelajaran/laporan-harian-siswa';
    const [existingMenu] = await queryInterface.sequelize.query(
      'SELECT id FROM menus WHERE route = :route LIMIT 1',
      { replacements: { route } }
    );

    let menuId = existingMenu[0]?.id || null;
    if (!menuId) {
      await queryInterface.bulkInsert('menus', [{
        group_id: groupId,
        parent_id: null,
        name: 'Laporan Harian Siswa',
        route,
        icon: 'calendar-days',
        permission_code: 'lesson_attendance.daily_report.view',
        sort_order: 3,
        is_active: true,
        created_at: now
      }]);
      const [inserted] = await queryInterface.sequelize.query(
        'SELECT id FROM menus WHERE route = :route LIMIT 1',
        { replacements: { route } }
      );
      menuId = inserted[0].id;
    } else {
      await queryInterface.sequelize.query(
        `UPDATE menus
         SET group_id = :groupId, parent_id = NULL, name = 'Laporan Harian Siswa',
             icon = 'calendar-days', permission_code = 'lesson_attendance.daily_report.view',
             sort_order = 3, is_active = 1
         WHERE id = :menuId`,
        { replacements: { groupId, menuId } }
      );
    }

    const viewPermId = permMap.get('lesson_attendance.daily_report.view');
    if (menuId && viewPermId) {
      const [mpExists] = await queryInterface.sequelize.query(
        'SELECT id FROM menu_permissions WHERE menu_id = :menuId AND permission_id = :permId LIMIT 1',
        { replacements: { menuId, permId: viewPermId } }
      );
      if (mpExists.length === 0) {
        await queryInterface.bulkInsert('menu_permissions', [{
          menu_id: menuId,
          permission_id: viewPermId
        }]);
      }
    }
  },

  async down(queryInterface) {
    const route = '/presensi-jam-pelajaran/laporan-harian-siswa';
    const codes = [
      'lesson_attendance.daily_report.view',
      'lesson_attendance.daily_report.export_excel',
      'lesson_attendance.daily_report.export_pdf'
    ];

    const [menuRows] = await queryInterface.sequelize.query(
      'SELECT id FROM menus WHERE route = :route',
      { replacements: { route } }
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
      "UPDATE menus SET sort_order = 3 WHERE route = '/presensi-jam-pelajaran/laporan'"
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
