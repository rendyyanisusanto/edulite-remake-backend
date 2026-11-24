'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const permissions = [
      {
        code: 'lesson_attendance.teacher_pin.view',
        name: 'View Teacher Attendance PIN Status',
        description: 'Melihat status PIN presensi jam pelajaran guru',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.teacher_pin.manage',
        name: 'Manage Teacher Attendance PIN',
        description: 'Generate, atur, reset, dan hapus PIN presensi jam pelajaran guru',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.class_qr.view',
        name: 'View Classroom Attendance QR',
        description: 'Melihat status dan QR Code presensi jam pelajaran kelas',
        platform: 'WEB'
      },
      {
        code: 'lesson_attendance.class_qr.manage',
        name: 'Manage Classroom Attendance QR',
        description: 'Generate, regenerate, aktifkan, dan nonaktifkan QR Code presensi kelas',
        platform: 'WEB'
      }
    ];

    for (const perm of permissions) {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM permissions WHERE code = :code LIMIT 1',
        { replacements: { code: perm.code } }
      );
      if (existing.length === 0) {
        await queryInterface.bulkInsert('permissions', [perm]);
      }
    }

    const [permRows] = await queryInterface.sequelize.query(
      'SELECT id, code FROM permissions WHERE code IN (:codes)',
      { replacements: { codes: permissions.map((p) => p.code) } }
    );

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
  },

  async down(queryInterface) {
    const codes = [
      'lesson_attendance.teacher_pin.view',
      'lesson_attendance.teacher_pin.manage',
      'lesson_attendance.class_qr.view',
      'lesson_attendance.class_qr.manage'
    ];
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
