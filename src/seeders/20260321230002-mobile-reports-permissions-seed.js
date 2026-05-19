'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        // 1. Insert new permissions for mobile reporting
        const newPermissions = [
            { code: 'violation.report.create', name: 'Create Mobile Violation Report', description: 'Submit student violations from mobile app', created_at: now },
            { code: 'violation.report.view_own', name: 'View Own Violation Reports', description: 'View submitted mobile violation reports', created_at: now },
            { code: 'positive_point.report.create', name: 'Create Mobile Positive Point Report', description: 'Submit student positive points from mobile app', created_at: now },
            { code: 'positive_point.report.view_own', name: 'View Own Positive Point Reports', description: 'View submitted mobile positive point reports', created_at: now }
        ];
        
        await queryInterface.bulkInsert('permissions', newPermissions, { ignoreDuplicates: true });

        // 2. Fetch IDs
        const [roles] = await queryInterface.sequelize.query(
            `SELECT id, name FROM roles WHERE name IN ('SUPERADMIN','ADMIN','GURU','GURU_BK')`
        );
        const roleMap = {};
        for (const r of roles) roleMap[r.name] = r.id;

        const [perms] = await queryInterface.sequelize.query(
            `SELECT id, code FROM permissions WHERE code IN (
                'violation.report.create',
                'violation.report.view_own',
                'positive_point.report.create',
                'positive_point.report.view_own'
            )`
        );
        const permMap = {};
        for (const p of perms) permMap[p.code] = p.id;

        // 3. Assign to roles
        // We'll give these rights to GURU, GURU_BK, ADMIN, SUPERADMIN
        const rpRecords = [];
        const permCodes = ['violation.report.create', 'violation.report.view_own', 'positive_point.report.create', 'positive_point.report.view_own'];
        for (const roleName of ['SUPERADMIN', 'ADMIN', 'GURU', 'GURU_BK']) {
            const roleId = roleMap[roleName];
            if (!roleId) continue;
            for (const code of permCodes) {
                const permId = permMap[code];
                if (permId) rpRecords.push({ role_id: roleId, permission_id: permId });
            }
        }

        if (rpRecords.length > 0) {
            await queryInterface.bulkInsert('role_permissions', rpRecords, { ignoreDuplicates: true });
        }
    },

    async down(queryInterface, Sequelize) {
        // Remove role_permissions
        await queryInterface.sequelize.query(
            `DELETE rp FROM role_permissions rp
             JOIN permissions p ON p.id = rp.permission_id
             WHERE p.code IN (
                 'violation.report.create',
                 'violation.report.view_own',
                 'positive_point.report.create',
                 'positive_point.report.view_own'
             )`
        );

        // Remove permissions
        await queryInterface.bulkDelete('permissions', {
            code: [
                'violation.report.create',
                'violation.report.view_own',
                'positive_point.report.create',
                'positive_point.report.view_own'
            ]
        }, {});
    }
};
