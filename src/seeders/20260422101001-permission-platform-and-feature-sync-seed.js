'use strict';

const fs = require('fs');
const path = require('path');

const WEB_ONLY_PREFIXES = [
    'user.',
    'role.',
    'permission.',
    'menu.',
    'setting.',
    'guestbook.',
    'academic_year.',
    'grade.',
    'department.',
    'class.',
    'teacher.',
    'class_history.',
    'class_assignment.',
    'attendance.shift.',
    'attendance.setting.',
    'attendance.monitor.',
    'attendance.report.',
    'attendance.request.approve',
    'attendance.request.reject',
    'violation_level.',
    'violation_type.',
    'positive_point_type.',
    'achievement_participant.',
    'achievement_result.',
    'achievement_point_rule.',
    'student_rfid.'
];

const MOBILE_ONLY_PREFIXES = [
    'violation.report.',
    'positive_point.report.'
];

const BOTH_PREFIXES = [
    'student.',
    'student_violation.',
    'student_positive_point.',
    'counseling_case.',
    'counseling_session.',
    'counseling_follow_up.',
    'permission_letter.',
    'extracurricular.',
    'achievement.',
    'attendance.history.',
    'attendance.request.view',
    'attendance.request.create',
    'attendance.request.update'
];

const EXTRA_FEATURE_CODES = [
    'dashboard.view',
    'certificate.view',
    'id_card.view',
    'character_report.view',
    'attendance.request.create',
    'attendance.request.update',
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

function walkFiles(dir, matcher, result = []) {
    if (!fs.existsSync(dir)) return result;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkFiles(fullPath, matcher, result);
            continue;
        }
        if (matcher(fullPath)) {
            result.push(fullPath);
        }
    }

    return result;
}

function extractPermissionCodesFromRoutes(routesRootDir) {
    const files = walkFiles(routesRootDir, (filePath) => filePath.endsWith('.routes.js'));
    const set = new Set();
    const regex = /permissionMiddleware\((['"`])([^'"`]+)\1\)/g;

    for (const filePath of files) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        let match = regex.exec(raw);
        while (match) {
            set.add(match[2]);
            match = regex.exec(raw);
        }
        regex.lastIndex = 0;
    }

    return set;
}

function inferPlatform(code) {
    if (MOBILE_ONLY_PREFIXES.some((prefix) => code.startsWith(prefix))) return 'MOBILE';
    if (WEB_ONLY_PREFIXES.some((prefix) => code.startsWith(prefix))) return 'WEB';
    if (BOTH_PREFIXES.some((prefix) => code.startsWith(prefix))) return 'BOTH';

    // Safe default for mixed/unknown feature permissions
    return 'BOTH';
}

function fallbackNameFromCode(code) {
    return code
        .replace(/[._]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (chr) => chr.toUpperCase());
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const now = new Date();

        const routePermissionCodes = extractPermissionCodesFromRoutes(path.resolve(__dirname, '..', 'modules'));
        EXTRA_FEATURE_CODES.forEach((code) => routePermissionCodes.add(code));

        const allFeatureCodes = Array.from(routePermissionCodes).sort();
        if (allFeatureCodes.length === 0) return;

        const [existingPermissions] = await queryInterface.sequelize.query(
            'SELECT id, code, name, description, platform FROM permissions'
        );

        const existingMap = new Map();
        existingPermissions.forEach((row) => existingMap.set(row.code, row));

        const rowsToInsert = [];
        for (const code of allFeatureCodes) {
            if (existingMap.has(code)) continue;
            rowsToInsert.push({
                code,
                name: fallbackNameFromCode(code),
                description: 'Auto generated from feature route mapping',
                platform: inferPlatform(code),
                created_at: now
            });
        }

        if (rowsToInsert.length > 0) {
            await queryInterface.bulkInsert('permissions', rowsToInsert);
        }

        const rowsToUpdate = [];
        for (const row of existingPermissions) {
            rowsToUpdate.push({ code: row.code, platform: inferPlatform(row.code) });
        }
        for (const row of rowsToInsert) {
            rowsToUpdate.push({ code: row.code, platform: row.platform });
        }

        for (const row of rowsToUpdate) {
            await queryInterface.sequelize.query(
                'UPDATE permissions SET platform = :platform WHERE code = :code',
                { replacements: { platform: row.platform, code: row.code } }
            );
        }
    },

    async down() {
        // Keep permission records and platform tags intact on rollback.
    }
};
