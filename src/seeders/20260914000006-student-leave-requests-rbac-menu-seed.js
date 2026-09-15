'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add Permissions
    const permissions = [
      { name: 'View Student Leave Requests', code: 'counseling.leave_requests.view', description: 'Lihat data perijinan siswa', platform: 'WEB' },
      { name: 'Create Student Leave Request', code: 'counseling.leave_requests.create', description: 'Buat pengajuan perijinan siswa', platform: 'WEB' },
      { name: 'Update Student Leave Request', code: 'counseling.leave_requests.update', description: 'Edit data perijinan siswa', platform: 'WEB' },
      { name: 'Delete Student Leave Request', code: 'counseling.leave_requests.delete', description: 'Hapus data perijinan siswa', platform: 'WEB' },
      { name: 'Approve/Reject Student Leave Request', code: 'counseling.leave_requests.approve', description: 'Persetujuan perijinan siswa', platform: 'WEB' }
    ];

    try {
      await queryInterface.bulkInsert('permissions', permissions, { ignoreDuplicates: true });
    } catch (e) {
      console.log('Permissions already exist or error:', e.message);
    }

    const insertedPermissions = await queryInterface.sequelize.query(
      `SELECT id, code FROM permissions WHERE code IN (${permissions.map(p => `'${p.code}'`).join(',')});`
    );

    const permissionMap = {};
    insertedPermissions[0].forEach(p => {
      permissionMap[p.code] = p.id;
    });

    // 2. Add Menu
    // Find 'Disiplin dan Konseling' group id
    const menuGroups = await queryInterface.sequelize.query(
      `SELECT id FROM menu_groups WHERE name = 'Disiplin & Konseling' OR name = 'Disiplin dan Konseling' LIMIT 1;`
    );
    let groupId;
    if (menuGroups[0].length > 0) {
      groupId = menuGroups[0][0].id;
    } else {
      // Create if not exists (fallback)
      await queryInterface.bulkInsert('menu_groups', [{
         name: 'Disiplin & Konseling',
         icon: 'HeroShieldCheck',
         sort_order: 50
      }]);
      const newGroups = await queryInterface.sequelize.query(
        `SELECT id FROM menu_groups WHERE name = 'Disiplin & Konseling' LIMIT 1;`
      );
      groupId = newGroups[0][0].id;
    }

    const menu = {
      group_id: groupId,
      parent_id: null,
      name: 'Perijinan Siswa',
      route: '/student-leave-requests',
      icon: 'HeroDocumentText',
      permission_code: 'counseling.leave_requests.view',
      sort_order: 15,
      is_active: true
    };

    try {
      await queryInterface.bulkInsert('menus', [menu], { ignoreDuplicates: true });
    } catch (e) {
      console.log('Menu already exists or error:', e.message);
    }

    const insertedMenu = await queryInterface.sequelize.query(
      `SELECT id FROM menus WHERE route = '/student-leave-requests';`
    );
    const menuId = insertedMenu[0][0].id;

    // 3. Map Menu Permissions
    const menuPermissions = insertedPermissions[0].map(p => ({
      menu_id: menuId,
      permission_id: p.id
    }));

    try {
      await queryInterface.bulkInsert('menu_permissions', menuPermissions, { ignoreDuplicates: true });
    } catch (e) {
      console.log('Menu permissions already exist or error:', e.message);
    }

    // 4. Assign permissions to Super Admin role
    const roles = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE LOWER(name) = 'super admin' OR LOWER(name) = 'superadmin' LIMIT 1;`
    );
    
    if (roles[0].length > 0) {
        const roleId = roles[0][0].id;
        const rolePermissions = insertedPermissions[0].map(p => ({
            role_id: roleId,
            permission_id: p.id
        }));
        try {
            await queryInterface.bulkInsert('role_permissions', rolePermissions, { ignoreDuplicates: true });
        } catch (e) {
            console.log('Role permissions already exist or error:', e.message);
        }
    }
  },

  async down(queryInterface, Sequelize) {
    const permissions = [
      'counseling.leave_requests.view',
      'counseling.leave_requests.create',
      'counseling.leave_requests.update',
      'counseling.leave_requests.delete',
      'counseling.leave_requests.approve'
    ];
    
    await queryInterface.bulkDelete('permissions', { code: { [Sequelize.Op.in]: permissions } });
    await queryInterface.bulkDelete('menus', { route: '/student-leave-requests' });
  }
};
