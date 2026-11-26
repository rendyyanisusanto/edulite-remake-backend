'use strict';

/**
 * LA-06 — Laporan Harian Terpadu: menu + permissions (idempotent, no hardcoded IDs).
 * Submenu is a sibling of "Laporan Harian Siswa": it copies group_id and parent_id from that row.
 * No business tables/columns are created or altered. Nothing is deleted on `up`.
 */
const ROUTE = '/presensi-jam-pelajaran/laporan-harian-terpadu';
const SIBLING_ROUTE = '/presensi-jam-pelajaran/laporan-harian-siswa';
const REPORT_ROUTE = '/presensi-jam-pelajaran/laporan';
const VIEW_CODE = 'lesson_attendance.integrated_daily_report.view';

const PERMISSIONS = [
  { code: VIEW_CODE, name: 'View Integrated Daily Attendance Report', description: 'Melihat laporan harian terpadu (gerbang, Tahfidz, jam pelajaran) per kelas' },
  { code: 'lesson_attendance.integrated_daily_report.export_excel', name: 'Export Integrated Daily Attendance Excel', description: 'Mengunduh laporan harian terpadu dalam format Excel' },
  { code: 'lesson_attendance.integrated_daily_report.export_pdf', name: 'Export Integrated Daily Attendance PDF', description: 'Mengunduh laporan harian terpadu dalam format PDF' }
];

// Roles that receive the permissions by default (matched by name, never by ID).
const TARGET_ROLES = ['superadmin', 'super admin', 'admin', 'kesiswaan', 'staff_kesiswaan', 'tatib', 'wali_kelas', 'wali kelas'];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const q = queryInterface.sequelize;

    for (const perm of PERMISSIONS) {
      const [existing] = await q.query('SELECT id FROM permissions WHERE code = :code LIMIT 1', { replacements: { code: perm.code } });
      if (existing.length === 0) {
        await queryInterface.bulkInsert('permissions', [{ ...perm, platform: 'WEB', created_at: now }]);
      }
    }
    const [permRows] = await q.query('SELECT id, code FROM permissions WHERE code IN (:codes)', {
      replacements: { codes: PERMISSIONS.map((p) => p.code) }
    });

    const [roles] = await q.query('SELECT id FROM roles WHERE LOWER(name) IN (:names)', { replacements: { names: TARGET_ROLES } });
    for (const role of roles) {
      for (const perm of permRows) {
        const [exists] = await q.query(
          'SELECT id FROM role_permissions WHERE role_id = :roleId AND permission_id = :permId LIMIT 1',
          { replacements: { roleId: role.id, permId: perm.id } }
        );
        if (exists.length === 0) {
          await queryInterface.bulkInsert('role_permissions', [{ role_id: role.id, permission_id: perm.id }]);
        }
      }
    }

    // Sibling menu supplies the parent/group so both submenus share the same parent.
    const [siblings] = await q.query(
      'SELECT id, group_id, parent_id, sort_order FROM menus WHERE route = :route LIMIT 1',
      { replacements: { route: SIBLING_ROUTE } }
    );
    if (siblings.length === 0) {
      throw new Error('Menu "Laporan Harian Siswa" tidak ditemukan. Jalankan seeder LA-05 terlebih dahulu.');
    }
    const sibling = siblings[0];
    const sortOrder = Number(sibling.sort_order) + 1;

    // Make room: shift "Laporan Presensi" after the new submenu (only when it would collide).
    await q.query(
      'UPDATE menus SET sort_order = :next WHERE group_id = :groupId AND route = :route AND sort_order <= :sortOrder',
      { replacements: { next: sortOrder + 1, groupId: sibling.group_id, route: REPORT_ROUTE, sortOrder } }
    );

    const [found] = await q.query('SELECT id FROM menus WHERE route = :route LIMIT 1', { replacements: { route: ROUTE } });
    let menuId = found[0]?.id || null;
    if (!menuId) {
      await queryInterface.bulkInsert('menus', [{
        group_id: sibling.group_id,
        parent_id: sibling.parent_id,
        name: 'Laporan Harian Terpadu',
        route: ROUTE,
        icon: 'file-check',
        permission_code: VIEW_CODE,
        sort_order: sortOrder,
        is_active: true,
        created_at: now
      }]);
      const [inserted] = await q.query('SELECT id FROM menus WHERE route = :route LIMIT 1', { replacements: { route: ROUTE } });
      menuId = inserted[0].id;
    } else {
      await q.query(
        `UPDATE menus SET group_id = :groupId, parent_id = :parentId, name = 'Laporan Harian Terpadu',
                icon = 'file-check', permission_code = :code, sort_order = :sortOrder, is_active = 1
         WHERE id = :menuId`,
        { replacements: { groupId: sibling.group_id, parentId: sibling.parent_id, code: VIEW_CODE, sortOrder, menuId } }
      );
    }

    const viewPerm = permRows.find((p) => p.code === VIEW_CODE);
    if (menuId && viewPerm) {
      const [mp] = await q.query(
        'SELECT id FROM menu_permissions WHERE menu_id = :menuId AND permission_id = :permId LIMIT 1',
        { replacements: { menuId, permId: viewPerm.id } }
      );
      if (mp.length === 0) {
        await queryInterface.bulkInsert('menu_permissions', [{ menu_id: menuId, permission_id: viewPerm.id }]);
      }
    }
  },

  async down(queryInterface) {
    // Only removes records created by this seeder; existing menus/permissions are untouched.
    const q = queryInterface.sequelize;
    const [menus] = await q.query('SELECT id FROM menus WHERE route = :route', { replacements: { route: ROUTE } });
    const menuIds = menus.map((m) => m.id);
    if (menuIds.length) {
      await q.query('DELETE FROM menu_permissions WHERE menu_id IN (:menuIds)', { replacements: { menuIds } });
      await q.query('DELETE FROM menus WHERE id IN (:menuIds)', { replacements: { menuIds } });
    }
    const [perms] = await q.query('SELECT id FROM permissions WHERE code IN (:codes)', {
      replacements: { codes: PERMISSIONS.map((p) => p.code) }
    });
    const permIds = perms.map((p) => p.id);
    if (permIds.length) {
      await q.query('DELETE FROM role_permissions WHERE permission_id IN (:permIds)', { replacements: { permIds } });
      await q.query('DELETE FROM permissions WHERE id IN (:permIds)', { replacements: { permIds } });
    }
    await q.query(
      "UPDATE menus SET sort_order = sort_order - 1 WHERE route = :route AND sort_order > 4",
      { replacements: { route: REPORT_ROUTE } }
    );
  }
};
