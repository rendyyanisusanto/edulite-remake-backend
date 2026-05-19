'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        const roleDefs = [
            { name: 'PELATIH_EKSKUL', description: 'Pelatih ekstrakurikuler internal atau eksternal' },
            { name: 'STAFF_KESISWAAN', description: 'Staff kesiswaan' },
            { name: 'KESISWAAN', description: 'Bidang kesiswaan' }
        ];
        await queryInterface.bulkInsert('roles', roleDefs, { ignoreDuplicates: true });

        const permissionDefs = [
            ['extracurricular.view', 'View Extracurricular', 'Lihat data ekstrakurikuler'],
            ['extracurricular.create', 'Create Extracurricular', 'Buat data ekstrakurikuler'],
            ['extracurricular.update', 'Update Extracurricular', 'Ubah data ekstrakurikuler'],
            ['extracurricular.delete', 'Delete Extracurricular', 'Hapus data ekstrakurikuler'],
            ['extracurricular.manage_trainer', 'Manage Extracurricular Coach', 'Kelola pelatih ekstrakurikuler'],
            ['extracurricular.manage_schedule', 'Manage Extracurricular Schedule', 'Kelola jadwal ekstrakurikuler'],

            ['extracurricular.registration.view', 'View Extracurricular Registration', '[DEPRECATED] Lihat pendaftaran ekstrakurikuler'],
            ['extracurricular.registration.create', 'Create Extracurricular Registration', '[DEPRECATED] Daftar ekstrakurikuler'],
            ['extracurricular.registration.approve', 'Approve Extracurricular Registration', '[DEPRECATED] Setujui pendaftaran ekstrakurikuler'],
            ['extracurricular.registration.reject', 'Reject Extracurricular Registration', '[DEPRECATED] Tolak pendaftaran ekstrakurikuler'],

            ['extracurricular.member.view', 'View Extracurricular Member', 'Lihat anggota ekstrakurikuler'],
            ['extracurricular.member.manage', 'Manage Extracurricular Member', 'Kelola anggota ekstrakurikuler'],

            ['extracurricular.session.view', 'View Extracurricular Session', 'Lihat sesi ekstrakurikuler'],
            ['extracurricular.session.create', 'Create Extracurricular Session', 'Buat sesi ekstrakurikuler'],
            ['extracurricular.session.update', 'Update Extracurricular Session', 'Ubah sesi ekstrakurikuler'],
            ['extracurricular.session.close', 'Close Extracurricular Session', 'Tutup sesi ekstrakurikuler'],

            ['extracurricular.coach_attendance.mark', 'Mark Coach Attendance', 'Isi presensi pelatih'],
            ['extracurricular.student_attendance.view', 'View Student Attendance', 'Lihat presensi siswa ekstrakurikuler'],
            ['extracurricular.student_attendance.mark', 'Mark Student Attendance', 'Isi presensi siswa ekstrakurikuler'],

            ['extracurricular.progress.view', 'View Extracurricular Progress', 'Lihat perkembangan siswa ekstrakurikuler'],
            ['extracurricular.progress.create', 'Create Extracurricular Progress', 'Input perkembangan siswa ekstrakurikuler'],
            ['extracurricular.progress.update', 'Update Extracurricular Progress', 'Ubah perkembangan siswa ekstrakurikuler'],
            ['extracurricular.progress.report', 'Report Extracurricular Progress', 'Rekap perkembangan siswa ekstrakurikuler'],

            ['extracurricular.my.view', 'View My Extracurricular Data', 'Akses endpoint personal ekstrakurikuler']
        ];

        await queryInterface.bulkInsert('permissions', permissionDefs.map(([code, name, description]) => ({
            code,
            name,
            description,
            created_at: now
        })), { ignoreDuplicates: true });

        const [roles] = await queryInterface.sequelize.query(
            `SELECT id, name FROM roles WHERE name IN ('SUPERADMIN','ADMIN','STAFF_KESISWAAN','STAFF KESISWAAN','KESISWAAN','PELATIH_EKSKUL','SISWA')`
        );
        const roleMap = {};
        for (const role of roles) roleMap[role.name] = role.id;

        const [permissions] = await queryInterface.sequelize.query(
            `SELECT id, code FROM permissions WHERE code LIKE 'extracurricular.%'`
        );
        const permissionMap = {};
        for (const permission of permissions) permissionMap[permission.code] = permission.id;

        const allExtracurricularCodes = permissionDefs.map(item => item[0]);
        const adminCodes = allExtracurricularCodes.filter(code => code !== 'extracurricular.delete');
        const staffCodes = [
            'extracurricular.view', 'extracurricular.create', 'extracurricular.update',
            'extracurricular.manage_trainer', 'extracurricular.manage_schedule',
            'extracurricular.member.view', 'extracurricular.member.manage',
            'extracurricular.session.view', 'extracurricular.session.create', 'extracurricular.session.update',
            'extracurricular.student_attendance.view', 'extracurricular.progress.view', 'extracurricular.progress.report'
        ];
        const kesiswaanCodes = [
            ...staffCodes,
            'extracurricular.session.close'
        ];
        const coachCodes = [
            'extracurricular.my.view',
            'extracurricular.view',
            'extracurricular.member.view',
            'extracurricular.session.view',
            'extracurricular.session.create',
            'extracurricular.session.update',
            'extracurricular.coach_attendance.mark',
            'extracurricular.student_attendance.view',
            'extracurricular.student_attendance.mark',
            'extracurricular.progress.view',
            'extracurricular.progress.create',
            'extracurricular.progress.update'
        ];
        const studentCodes = [
            'extracurricular.my.view'
        ];

        const buildRolePermissionRows = (roleId, codes) => {
            if (!roleId) return [];
            return codes
                .filter(code => permissionMap[code])
                .map(code => ({ role_id: roleId, permission_id: permissionMap[code] }));
        };

        const rolePermissionRows = [
            ...buildRolePermissionRows(roleMap.SUPERADMIN, allExtracurricularCodes),
            ...buildRolePermissionRows(roleMap.ADMIN, adminCodes),
            ...buildRolePermissionRows(roleMap.STAFF_KESISWAAN || roleMap['STAFF KESISWAAN'], staffCodes),
            ...buildRolePermissionRows(roleMap.KESISWAAN, kesiswaanCodes),
            ...buildRolePermissionRows(roleMap.PELATIH_EKSKUL, coachCodes),
            ...buildRolePermissionRows(roleMap.SISWA, studentCodes)
        ];

        if (rolePermissionRows.length > 0) {
            await queryInterface.bulkInsert('role_permissions', rolePermissionRows, { ignoreDuplicates: true });
        }

        await queryInterface.bulkInsert('menu_groups', [
            { name: 'Ekstrakurikuler', icon: 'sparkles', sort_order: 8, created_at: now }
        ], { ignoreDuplicates: true });

        const [menuGroups] = await queryInterface.sequelize.query(
            `SELECT id FROM menu_groups WHERE name = 'Ekstrakurikuler' LIMIT 1`
        );
        const groupId = menuGroups[0]?.id;

        if (!groupId) return;

        const menuDefs = [
            { name: 'Master Ekskul', route: '/extracurricular/master', icon: 'collection', permission_code: 'extracurricular.view', sort_order: 1 },
            { name: 'Pelatih Ekskul', route: '/extracurricular/coaches', icon: 'academic-cap', permission_code: 'extracurricular.manage_trainer', sort_order: 2 },
            { name: 'Jadwal Ekskul', route: '/extracurricular/schedules', icon: 'calendar', permission_code: 'extracurricular.manage_schedule', sort_order: 3 },
            { name: 'Anggota Ekskul', route: '/extracurricular/members', icon: 'user-group', permission_code: 'extracurricular.member.view', sort_order: 4 },
            { name: 'Sesi Ekskul', route: '/extracurricular/sessions', icon: 'clock', permission_code: 'extracurricular.session.view', sort_order: 5 },
            { name: 'Presensi Ekskul', route: '/extracurricular/attendances', icon: 'check-circle', permission_code: 'extracurricular.student_attendance.view', sort_order: 6 },
            { name: 'Perkembangan Ekskul', route: '/extracurricular/progress', icon: 'chart-bar', permission_code: 'extracurricular.progress.view', sort_order: 7 }
        ];

        await queryInterface.bulkInsert('menus', menuDefs.map(item => ({
            group_id: groupId,
            parent_id: null,
            name: item.name,
            route: item.route,
            icon: item.icon,
            permission_code: item.permission_code,
            sort_order: item.sort_order,
            is_active: true,
            created_at: now
        })), { ignoreDuplicates: true });

        const [menus] = await queryInterface.sequelize.query(
            `SELECT id, permission_code FROM menus WHERE group_id = ${groupId}`
        );

        const menuPermissionRows = menus
            .filter(menu => permissionMap[menu.permission_code])
            .map(menu => ({ menu_id: menu.id, permission_id: permissionMap[menu.permission_code] }));

        if (menuPermissionRows.length > 0) {
            await queryInterface.bulkInsert('menu_permissions', menuPermissionRows, { ignoreDuplicates: true });
        }
    },

    async down(queryInterface, Sequelize) {
        const codes = [
            'extracurricular.view',
            'extracurricular.create',
            'extracurricular.update',
            'extracurricular.delete',
            'extracurricular.manage_trainer',
            'extracurricular.manage_schedule',
            'extracurricular.registration.view',
            'extracurricular.registration.create',
            'extracurricular.registration.approve',
            'extracurricular.registration.reject',
            'extracurricular.member.view',
            'extracurricular.member.manage',
            'extracurricular.session.view',
            'extracurricular.session.create',
            'extracurricular.session.update',
            'extracurricular.session.close',
            'extracurricular.coach_attendance.mark',
            'extracurricular.student_attendance.view',
            'extracurricular.student_attendance.mark',
            'extracurricular.progress.view',
            'extracurricular.progress.create',
            'extracurricular.progress.update',
            'extracurricular.progress.report',
            'extracurricular.my.view'
        ];

        const [groupRows] = await queryInterface.sequelize.query(
            `SELECT id FROM menu_groups WHERE name = 'Ekstrakurikuler' LIMIT 1`
        );
        const groupId = groupRows[0]?.id;

        if (groupId) {
            await queryInterface.sequelize.query(`DELETE mp FROM menu_permissions mp JOIN menus m ON m.id = mp.menu_id WHERE m.group_id = ${groupId}`);
            await queryInterface.sequelize.query(`DELETE FROM menus WHERE group_id = ${groupId}`);
            await queryInterface.sequelize.query(`DELETE FROM menu_groups WHERE id = ${groupId}`);
        }

        await queryInterface.sequelize.query(
            `DELETE rp FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE p.code IN (${codes.map(c => `'${c}'`).join(',')})`
        );

        await queryInterface.bulkDelete('permissions', { code: codes }, {});

        await queryInterface.bulkDelete('roles', {
            name: ['PELATIH_EKSKUL', 'STAFF_KESISWAAN', 'KESISWAAN']
        }, {});
    }
};
