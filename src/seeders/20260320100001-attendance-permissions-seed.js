'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        // ─── 1. Permissions ───────────────────────────────────────────────────
        const permDefs = [
            ['attendance.shift.view', 'View Attendance Shifts', 'View shift master list'],
            ['attendance.shift.create', 'Create Attendance Shift', 'Add new shift'],
            ['attendance.shift.update', 'Update Attendance Shift', 'Edit shift data'],
            ['attendance.shift.delete', 'Delete Attendance Shift', 'Delete shift'],
            ['attendance.setting.view', 'View Attendance Settings', 'View attendance configuration'],
            ['attendance.setting.update', 'Update Attendance Settings', 'Update attendance configuration'],
            ['attendance.monitor.view', 'View Attendance Monitoring', 'Monitor daily attendance'],
            ['attendance.history.view', 'View Attendance History', 'View attendance history'],
            ['attendance.report.view', 'View Attendance Reports', 'View attendance reports'],
            ['attendance.report.export', 'Export Attendance Reports', 'Export attendance reports to Excel'],
            ['attendance.request.view', 'View Attendance Requests', 'View attendance requests'],
            ['attendance.request.approve', 'Approve Attendance Request', 'Approve attendance requests'],
            ['attendance.request.reject', 'Reject Attendance Request', 'Reject attendance requests'],
        ];

        const permissions = permDefs.map(([code, name, description]) => ({ code, name, description, created_at: now }));
        await queryInterface.bulkInsert('permissions', permissions, { ignoreDuplicates: true });

        // ─── 2. Get role IDs ─────────────────────────────────────────────────
        const [roles] = await queryInterface.sequelize.query(
            `SELECT id, name FROM roles WHERE name IN ('SUPERADMIN','ADMIN')`
        );
        const roleMap = {};
        for (const r of roles) roleMap[r.name] = r.id;

        // ─── 3. Get permission IDs ────────────────────────────────────────────
        const [allPerms] = await queryInterface.sequelize.query(
            `SELECT id, code FROM permissions WHERE code LIKE 'attendance.%'`
        );
        const permMap = {};
        for (const p of allPerms) permMap[p.code] = p.id;

        const adminCodes = [
            'attendance.shift.view', 'attendance.shift.create', 'attendance.shift.update', 'attendance.shift.delete',
            'attendance.setting.view', 'attendance.setting.update',
            'attendance.monitor.view',
            'attendance.history.view',
            'attendance.report.view', 'attendance.report.export',
            'attendance.request.view', 'attendance.request.approve', 'attendance.request.reject'
        ];

        const buildRP = (roleId, codes) => codes
            .filter(c => permMap[c] && roleId)
            .map(c => ({ role_id: roleId, permission_id: permMap[c] }));

        const rpRecords = [
            ...buildRP(roleMap['ADMIN'], adminCodes)
        ];

        if (rpRecords.length > 0) {
            await queryInterface.bulkInsert('role_permissions', rpRecords, { ignoreDuplicates: true });
        }

        // ─── 4. Menu Group ────────────────────────────────────────────────────
        await queryInterface.bulkInsert('menu_groups', [
            { name: 'Absensi', icon: 'clock', sort_order: 7, created_at: now }
        ], { ignoreDuplicates: true });

        const [groups] = await queryInterface.sequelize.query(
            `SELECT id FROM menu_groups WHERE name = 'Absensi' LIMIT 1`
        );
        const groupId = groups[0]?.id;
        if (!groupId) return;

        // ─── 5. Menu Items ────────────────────────────────────────────────────
        const menuDefs = [
            { name: 'Master Shift', route: '/attendance/shifts', icon: 'adjustments', permission_code: 'attendance.shift.view', sort_order: 1 },
            { name: 'Pengaturan Absensi', route: '/attendance/settings', icon: 'cog', permission_code: 'attendance.setting.view', sort_order: 2 },
            { name: 'Monitoring Absensi', route: '/attendance/monitoring', icon: 'eye', permission_code: 'attendance.monitor.view', sort_order: 3 },
            { name: 'Riwayat Absensi', route: '/attendance/history', icon: 'clock', permission_code: 'attendance.history.view', sort_order: 4 },
            { name: 'Laporan Absensi', route: '/attendance/reports', icon: 'chart-bar', permission_code: 'attendance.report.view', sort_order: 5 },
            { name: 'Pengajuan Absensi', route: '/attendance/requests', icon: 'clipboard-check', permission_code: 'attendance.request.view', sort_order: 6 },
        ];

        const menuRows = menuDefs.map(m => ({
            group_id: groupId,
            parent_id: null,
            name: m.name,
            route: m.route,
            icon: m.icon,
            permission_code: m.permission_code,
            sort_order: m.sort_order,
            is_active: true,
            created_at: now
        }));

        await queryInterface.bulkInsert('menus', menuRows, { ignoreDuplicates: true });

        // ─── 6. Menu Permissions ──────────────────────────────────────────────
        const [menus] = await queryInterface.sequelize.query(
            `SELECT id, permission_code FROM menus WHERE group_id = ${groupId}`
        );

        const menuPermRows = [];
        for (const menu of menus) {
            const permId = permMap[menu.permission_code];
            if (permId) menuPermRows.push({ menu_id: menu.id, permission_id: permId });
        }

        if (menuPermRows.length > 0) {
            await queryInterface.bulkInsert('menu_permissions', menuPermRows, { ignoreDuplicates: true });
        }
    },

    async down(queryInterface, Sequelize) {
        // Remove menu_permissions, menus, menu_group, role_permissions, permissions
        const [groups] = await queryInterface.sequelize.query(
            `SELECT id FROM menu_groups WHERE name = 'Absensi' LIMIT 1`
        );
        const groupId = groups[0]?.id;
        if (groupId) {
            await queryInterface.sequelize.query(`DELETE mp FROM menu_permissions mp JOIN menus m ON m.id = mp.menu_id WHERE m.group_id = ${groupId}`);
            await queryInterface.sequelize.query(`DELETE FROM menus WHERE group_id = ${groupId}`);
            await queryInterface.sequelize.query(`DELETE FROM menu_groups WHERE id = ${groupId}`);
        }
        const codes = [
            'attendance.shift.view','attendance.shift.create','attendance.shift.update','attendance.shift.delete',
            'attendance.setting.view','attendance.setting.update',
            'attendance.monitor.view','attendance.history.view',
            'attendance.report.view','attendance.report.export',
            'attendance.request.view','attendance.request.approve','attendance.request.reject'
        ];
        await queryInterface.sequelize.query(
            `DELETE rp FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE p.code IN (${codes.map(c => `'${c}'`).join(',')})`
        );
        await queryInterface.sequelize.query(
            `DELETE FROM permissions WHERE code IN (${codes.map(c => `'${c}'`).join(',')})`
        );
    }
};
