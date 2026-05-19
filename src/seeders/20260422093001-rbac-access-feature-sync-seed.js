'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const now = new Date();

        const missingPermissionDefs = [
            ['class_assignment.bulk_assign', 'Bulk Assign Class', 'Bulk assign siswa ke kelas'],
            ['class_assignment.bulk_move', 'Bulk Move Class', 'Bulk pindah siswa antar kelas'],
            ['class_assignment.delete', 'Delete Class Assignment', 'Hapus assignment kelas siswa'],
            ['counseling_case.change_status', 'Change Counseling Case Status', 'Ubah status kasus konseling'],
            ['counseling_follow_up.view', 'View Counseling Follow Up', 'Lihat daftar tindak lanjut konseling'],

            ['student_rfid.shift.view', 'View Student RFID Shift', 'Lihat master shift absensi RFID siswa'],
            ['student_rfid.shift.manage', 'Manage Student RFID Shift', 'Kelola master shift absensi RFID siswa'],
            ['student_rfid.shift_class.view', 'View Student RFID Shift-Class Mapping', 'Lihat mapping shift per kelas siswa'],
            ['student_rfid.shift_class.manage', 'Manage Student RFID Shift-Class Mapping', 'Kelola mapping shift per kelas siswa'],
            ['student_rfid.shift_student.view', 'View Student RFID Shift-Student Override', 'Lihat override shift per siswa'],
            ['student_rfid.shift_student.manage', 'Manage Student RFID Shift-Student Override', 'Kelola override shift per siswa'],
            ['student_rfid.mapping.view', 'View Student RFID Mapping', 'Lihat mapping kartu RFID siswa'],
            ['student_rfid.mapping.manage', 'Manage Student RFID Mapping', 'Kelola mapping kartu RFID siswa'],
            ['student_rfid.attendance.monitor.view', 'View Student RFID Attendance Monitoring', 'Lihat monitoring absensi gerbang RFID siswa'],
            ['student_rfid.attendance.daily.view', 'View Student RFID Daily Attendance', 'Lihat absensi harian RFID siswa'],
            ['student_rfid.attendance.correction.view', 'View Student RFID Attendance Correction', 'Lihat pengajuan koreksi absensi RFID siswa'],
            ['student_rfid.attendance.correction.manage', 'Manage Student RFID Attendance Correction', 'Review/approve koreksi absensi RFID siswa'],
            ['student_rfid.toilet.monitor.view', 'View Student RFID Toilet Monitoring', 'Lihat monitoring izin toilet RFID siswa'],
            ['student_rfid.toilet.history.view', 'View Student RFID Toilet History', 'Lihat riwayat izin toilet RFID siswa'],
            ['student_rfid.report.attendance.view', 'View Student RFID Attendance Report', 'Lihat laporan absensi RFID siswa'],
            ['student_rfid.report.toilet.view', 'View Student RFID Toilet Report', 'Lihat laporan izin toilet RFID siswa']
        ];

        await queryInterface.bulkInsert(
            'permissions',
            missingPermissionDefs.map(([code, name, description]) => ({ code, name, description, created_at: now })),
            { ignoreDuplicates: true }
        );

        const [roles] = await queryInterface.sequelize.query(
            "SELECT id, name FROM roles WHERE name IN ('SUPERADMIN','ADMIN','GURU','GURU_BK','KESISWAAN','STAFF_KESISWAAN','STAFF KESISWAAN')"
        );
        const roleMap = {};
        roles.forEach((role) => { roleMap[role.name] = role.id; });

        const allNewCodes = missingPermissionDefs.map(([code]) => code);
        const [permissions] = await queryInterface.sequelize.query(
            `SELECT id, code FROM permissions WHERE code IN (${allNewCodes.map((code) => queryInterface.sequelize.escape(code)).join(',')})`
        );
        const permMap = {};
        permissions.forEach((permission) => { permMap[permission.code] = permission.id; });

        const rolePermissionsToAssign = [];

        const addRolePermissionByCodes = (roleId, codes) => {
            if (!roleId) return;
            codes.forEach((code) => {
                const permissionId = permMap[code];
                if (permissionId) {
                    rolePermissionsToAssign.push({ role_id: roleId, permission_id: permissionId });
                }
            });
        };

        const rSuperadmin = roleMap.SUPERADMIN;
        const rAdmin = roleMap.ADMIN;
        const rGuru = roleMap.GURU;
        const rGuruBk = roleMap.GURU_BK;
        const rKesiswaan = roleMap.KESISWAAN;
        const rStaffKesiswaan = roleMap.STAFF_KESISWAAN || roleMap['STAFF KESISWAAN'];

        // SUPERADMIN & ADMIN get all new permissions
        addRolePermissionByCodes(rSuperadmin, allNewCodes);
        addRolePermissionByCodes(rAdmin, allNewCodes);

        // Class assignment operations for operations-focused roles
        const classAssignmentActionCodes = [
            'class_assignment.bulk_assign',
            'class_assignment.bulk_move',
            'class_assignment.delete'
        ];
        addRolePermissionByCodes(rKesiswaan, classAssignmentActionCodes);
        addRolePermissionByCodes(rStaffKesiswaan, classAssignmentActionCodes);

        // Counseling status + follow up visibility for counseling actors
        const counselingCodes = ['counseling_case.change_status', 'counseling_follow_up.view'];
        addRolePermissionByCodes(rGuru, counselingCodes);
        addRolePermissionByCodes(rGuruBk, counselingCodes);
        addRolePermissionByCodes(rKesiswaan, counselingCodes);
        addRolePermissionByCodes(rStaffKesiswaan, counselingCodes);

        // RFID permissions: default to ADMIN + student affairs operators
        const rfidCodes = allNewCodes.filter((code) => code.startsWith('student_rfid.'));
        addRolePermissionByCodes(rKesiswaan, rfidCodes);
        addRolePermissionByCodes(rStaffKesiswaan, rfidCodes);

        // Backward compatibility mapping from legacy permissions
        const [legacyRows] = await queryInterface.sequelize.query(`
            SELECT rp.role_id, p.code
            FROM role_permissions rp
            JOIN permissions p ON p.id = rp.permission_id
            WHERE p.code IN ('class_assignment.manage','counseling_followup.view','counseling_case.update')
        `);

        legacyRows.forEach((row) => {
            if (row.code === 'class_assignment.manage') {
                classAssignmentActionCodes.forEach((code) => {
                    const permissionId = permMap[code];
                    if (permissionId) rolePermissionsToAssign.push({ role_id: row.role_id, permission_id: permissionId });
                });
            }
            if (row.code === 'counseling_followup.view') {
                const permissionId = permMap['counseling_follow_up.view'];
                if (permissionId) rolePermissionsToAssign.push({ role_id: row.role_id, permission_id: permissionId });
            }
            if (row.code === 'counseling_case.update') {
                const permissionId = permMap['counseling_case.change_status'];
                if (permissionId) rolePermissionsToAssign.push({ role_id: row.role_id, permission_id: permissionId });
            }
        });

        if (rolePermissionsToAssign.length > 0) {
            const roleIds = [...new Set(rolePermissionsToAssign.map((item) => item.role_id))];
            const permIds = [...new Set(rolePermissionsToAssign.map((item) => item.permission_id))];

            const [existingRolePerms] = await queryInterface.sequelize.query(`
                SELECT role_id, permission_id
                FROM role_permissions
                WHERE role_id IN (${roleIds.join(',')})
                  AND permission_id IN (${permIds.join(',')})
            `);

            const existingSet = new Set(existingRolePerms.map((item) => `${item.role_id}:${item.permission_id}`));
            const insertRows = rolePermissionsToAssign.filter(
                (item) => !existingSet.has(`${item.role_id}:${item.permission_id}`)
            );

            if (insertRows.length > 0) {
                await queryInterface.bulkInsert('role_permissions', insertRows);
            }
        }

        // Fix menu permission code mismatch for counseling follow up
        await queryInterface.sequelize.query(`
            UPDATE menus
            SET permission_code = 'counseling_follow_up.view'
            WHERE route = '/counseling-followups'
              AND (permission_code = 'counseling_followup.view' OR permission_code IS NULL)
        `);

        // Ensure RFID menu group exists
        await queryInterface.bulkInsert('menu_groups', [
            { name: 'RFID Siswa', icon: 'chip', sort_order: 9, created_at: now }
        ], { ignoreDuplicates: true });

        const [menuGroups] = await queryInterface.sequelize.query(
            "SELECT id FROM menu_groups WHERE name = 'RFID Siswa' LIMIT 1"
        );
        const rfidGroupId = menuGroups[0] && menuGroups[0].id;

        if (!rfidGroupId) return;

        const rfidMenuDefs = [
            ['Master Shift Siswa', '/student-rfid/master/shifts', 'adjustments', 'student_rfid.shift.view', 1],
            ['Mapping Shift Kelas', '/student-rfid/master/shift-classes', 'view-grid', 'student_rfid.shift_class.view', 2],
            ['Override Shift Siswa', '/student-rfid/master/shift-students', 'users', 'student_rfid.shift_student.view', 3],
            ['Mapping Kartu RFID', '/student-rfid/master/rfid-mapping', 'credit-card', 'student_rfid.mapping.view', 4],
            ['Monitoring Gerbang', '/student-rfid/attendance/monitoring', 'eye', 'student_rfid.attendance.monitor.view', 5],
            ['Absensi Harian', '/student-rfid/attendance/daily', 'calendar', 'student_rfid.attendance.daily.view', 6],
            ['Koreksi Absensi', '/student-rfid/attendance/corrections', 'refresh', 'student_rfid.attendance.correction.view', 7],
            ['Monitoring Toilet', '/student-rfid/toilet/monitoring', 'clipboard-check', 'student_rfid.toilet.monitor.view', 8],
            ['Riwayat Toilet', '/student-rfid/toilet/history', 'clock', 'student_rfid.toilet.history.view', 9],
            ['Laporan Absensi RFID', '/student-rfid/reports/attendance', 'chart-bar', 'student_rfid.report.attendance.view', 10],
            ['Laporan Toilet RFID', '/student-rfid/reports/toilet', 'document-report', 'student_rfid.report.toilet.view', 11]
        ];

        for (const [name, route, icon, permissionCode, sortOrder] of rfidMenuDefs) {
            const [existingMenus] = await queryInterface.sequelize.query(
                `SELECT id FROM menus WHERE route = ${queryInterface.sequelize.escape(route)} LIMIT 1`
            );

            if (existingMenus.length > 0) {
                await queryInterface.sequelize.query(`
                    UPDATE menus
                    SET
                        group_id = ${rfidGroupId},
                        name = ${queryInterface.sequelize.escape(name)},
                        icon = ${queryInterface.sequelize.escape(icon)},
                        permission_code = ${queryInterface.sequelize.escape(permissionCode)},
                        sort_order = ${sortOrder},
                        is_active = 1
                    WHERE id = ${existingMenus[0].id}
                `);
            } else {
                await queryInterface.bulkInsert('menus', [{
                    group_id: rfidGroupId,
                    parent_id: null,
                    name,
                    route,
                    icon,
                    permission_code: permissionCode,
                    sort_order: sortOrder,
                    is_active: true,
                    created_at: now
                }]);
            }
        }

        const [menuRows] = await queryInterface.sequelize.query(`
            SELECT id, permission_code
            FROM menus
            WHERE route IN (${rfidMenuDefs.map((item) => queryInterface.sequelize.escape(item[1])).join(',')}, '/counseling-followups')
        `);

        const menuPermissionRows = menuRows
            .map((menu) => ({
                menu_id: menu.id,
                permission_id: permMap[menu.permission_code]
            }))
            .filter((item) => !!item.permission_id);

        if (menuPermissionRows.length > 0) {
            const menuIds = [...new Set(menuPermissionRows.map((item) => item.menu_id))];
            const permIds = [...new Set(menuPermissionRows.map((item) => item.permission_id))];

            const [existingMenuPerms] = await queryInterface.sequelize.query(`
                SELECT menu_id, permission_id
                FROM menu_permissions
                WHERE menu_id IN (${menuIds.join(',')})
                  AND permission_id IN (${permIds.join(',')})
            `);

            const existingSet = new Set(existingMenuPerms.map((item) => `${item.menu_id}:${item.permission_id}`));
            const insertRows = menuPermissionRows.filter(
                (item) => !existingSet.has(`${item.menu_id}:${item.permission_id}`)
            );

            if (insertRows.length > 0) {
                await queryInterface.bulkInsert('menu_permissions', insertRows);
            }
        }
    },

    async down(queryInterface) {
        const newCodes = [
            'class_assignment.bulk_assign',
            'class_assignment.bulk_move',
            'class_assignment.delete',
            'counseling_case.change_status',
            'counseling_follow_up.view',
            'student_rfid.shift.view',
            'student_rfid.shift.manage',
            'student_rfid.shift_class.view',
            'student_rfid.shift_class.manage',
            'student_rfid.shift_student.view',
            'student_rfid.shift_student.manage',
            'student_rfid.mapping.view',
            'student_rfid.mapping.manage',
            'student_rfid.attendance.monitor.view',
            'student_rfid.attendance.daily.view',
            'student_rfid.attendance.correction.view',
            'student_rfid.attendance.correction.manage',
            'student_rfid.toilet.monitor.view',
            'student_rfid.toilet.history.view',
            'student_rfid.report.attendance.view',
            'student_rfid.report.toilet.view'
        ];

        await queryInterface.sequelize.query(`
            DELETE mp
            FROM menu_permissions mp
            JOIN menus m ON m.id = mp.menu_id
            WHERE m.route IN (
                '/student-rfid/master/shifts',
                '/student-rfid/master/shift-classes',
                '/student-rfid/master/shift-students',
                '/student-rfid/master/rfid-mapping',
                '/student-rfid/attendance/monitoring',
                '/student-rfid/attendance/daily',
                '/student-rfid/attendance/corrections',
                '/student-rfid/toilet/monitoring',
                '/student-rfid/toilet/history',
                '/student-rfid/reports/attendance',
                '/student-rfid/reports/toilet'
            )
        `);

        await queryInterface.bulkDelete('menus', {
            route: [
                '/student-rfid/master/shifts',
                '/student-rfid/master/shift-classes',
                '/student-rfid/master/shift-students',
                '/student-rfid/master/rfid-mapping',
                '/student-rfid/attendance/monitoring',
                '/student-rfid/attendance/daily',
                '/student-rfid/attendance/corrections',
                '/student-rfid/toilet/monitoring',
                '/student-rfid/toilet/history',
                '/student-rfid/reports/attendance',
                '/student-rfid/reports/toilet'
            ]
        }, {});

        await queryInterface.sequelize.query(`
            DELETE FROM menu_groups
            WHERE name = 'RFID Siswa'
              AND id NOT IN (SELECT DISTINCT group_id FROM menus)
        `);

        await queryInterface.sequelize.query(`
            DELETE rp
            FROM role_permissions rp
            JOIN permissions p ON p.id = rp.permission_id
            WHERE p.code IN (${newCodes.map((code) => queryInterface.sequelize.escape(code)).join(',')})
        `);

        await queryInterface.bulkDelete('permissions', { code: newCodes }, {});

        // Restore old permission_code if this seed is rolled back
        await queryInterface.sequelize.query(`
            UPDATE menus
            SET permission_code = 'counseling_followup.view'
            WHERE route = '/counseling-followups'
              AND permission_code = 'counseling_follow_up.view'
        `);
    }
};
