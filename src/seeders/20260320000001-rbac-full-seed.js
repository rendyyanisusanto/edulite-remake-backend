'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        // ─── 1. ROLES ────────────────────────────────────────────────────────
        await queryInterface.bulkInsert('roles', [
            { name: 'SUPERADMIN', description: 'System Administrator with full access' },
            { name: 'ADMIN', description: 'School Administrator' },
            { name: 'GURU', description: 'Teacher' },
            { name: 'SISWA', description: 'Student' },
            { name: 'ORTU', description: 'Parent / Guardian' }
        ], { ignoreDuplicates: true });

        // ─── 2. PERMISSIONS ──────────────────────────────────────────────────
        const permDefs = [
            // Dashboard
            ['dashboard.view', 'View Dashboard', 'Access dashboard page'],
            // Student
            ['student.view', 'View Students', 'View student list and detail'],
            ['student.create', 'Create Student', 'Add new student'],
            ['student.update', 'Update Student', 'Edit student data'],
            ['student.delete', 'Delete Student', 'Delete student data'],
            ['student.export', 'Export Students', 'Export student data'],
            ['student.import', 'Import Students', 'Import student data'],
            // Parent
            ['parent.view', 'View Parents', 'View parent/guardian list'],
            ['parent.create', 'Create Parent', 'Add parent/guardian'],
            ['parent.update', 'Update Parent', 'Edit parent/guardian'],
            ['parent.delete', 'Delete Parent', 'Delete parent/guardian'],
            // Student Documents
            ['student_document.view', 'View Student Documents', 'View student documents'],
            ['student_document.create', 'Upload Student Document', 'Upload student document'],
            ['student_document.update', 'Update Student Document', 'Edit student document'],
            ['student_document.delete', 'Delete Student Document', 'Delete student document'],
            // Class History
            ['class_history.view', 'View Class History', 'View student class history'],
            ['class_history.create', 'Create Class History', 'Assign student to class'],
            ['class_history.update', 'Update Class History', 'Edit class assignment'],
            ['class_history.delete', 'Delete Class History', 'Delete class assignment'],
            // Student Transfer
            ['student_transfer.view', 'View Student Transfers', 'View student transfer records'],
            ['student_transfer.create', 'Create Student Transfer', 'Process student transfer'],
            ['student_transfer.update', 'Update Student Transfer', 'Edit student transfer'],
            ['student_transfer.delete', 'Delete Student Transfer', 'Delete student transfer'],
            // ID Card
            ['id_card.view', 'View ID Cards', 'View student ID cards'],
            ['id_card.manage', 'Manage ID Cards', 'Generate and manage ID cards'],
            // Academic Year
            ['academic_year.view', 'View Academic Years', 'View academic years'],
            ['academic_year.create', 'Create Academic Year', 'Add academic year'],
            ['academic_year.update', 'Update Academic Year', 'Edit academic year'],
            ['academic_year.delete', 'Delete Academic Year', 'Delete academic year'],
            // Grade
            ['grade.view', 'View Grades', 'View grade levels'],
            ['grade.create', 'Create Grade', 'Add grade level'],
            ['grade.update', 'Update Grade', 'Edit grade level'],
            ['grade.delete', 'Delete Grade', 'Delete grade level'],
            // Department
            ['department.view', 'View Departments', 'View departments'],
            ['department.create', 'Create Department', 'Add department'],
            ['department.update', 'Update Department', 'Edit department'],
            ['department.delete', 'Delete Department', 'Delete department'],
            // Class
            ['class.view', 'View Classes', 'View classes'],
            ['class.create', 'Create Class', 'Add class'],
            ['class.update', 'Update Class', 'Edit class'],
            ['class.delete', 'Delete Class', 'Delete class'],
            // Teacher
            ['teacher.view', 'View Teachers', 'View teacher list'],
            ['teacher.create', 'Create Teacher', 'Add teacher'],
            ['teacher.update', 'Update Teacher', 'Edit teacher'],
            ['teacher.delete', 'Delete Teacher', 'Delete teacher'],
            // Achievement
            ['achievement.view', 'View Achievements', 'View achievements'],
            ['achievement.create', 'Create Achievement', 'Add achievement'],
            ['achievement.update', 'Update Achievement', 'Edit achievement'],
            ['achievement.delete', 'Delete Achievement', 'Delete achievement'],
            // Achievement Participant
            ['achievement_participant.view', 'View Achievement Participants', 'View participants'],
            ['achievement_participant.create', 'Add Achievement Participant', 'Add participant'],
            ['achievement_participant.update', 'Update Achievement Participant', 'Edit participant'],
            ['achievement_participant.delete', 'Delete Achievement Participant', 'Delete participant'],
            // Achievement Result
            ['achievement_result.view', 'View Achievement Results', 'View results'],
            ['achievement_result.create', 'Create Achievement Result', 'Add result'],
            ['achievement_result.update', 'Update Achievement Result', 'Edit result'],
            ['achievement_result.delete', 'Delete Achievement Result', 'Delete result'],
            // Achievement Point Rule
            ['achievement_point_rule.view', 'View Point Rules', 'View achievement point rules'],
            ['achievement_point_rule.create', 'Create Point Rule', 'Add point rule'],
            ['achievement_point_rule.update', 'Update Point Rule', 'Edit point rule'],
            ['achievement_point_rule.delete', 'Delete Point Rule', 'Delete point rule'],
            // Certificate
            ['certificate.view', 'View Certificates', 'View certificates'],
            ['certificate.manage', 'Manage Certificates', 'Generate and manage certificates'],
            // Violation Type
            ['violation_type.view', 'View Violation Types', 'View violation types'],
            ['violation_type.create', 'Create Violation Type', 'Add violation type'],
            ['violation_type.update', 'Update Violation Type', 'Edit violation type'],
            ['violation_type.delete', 'Delete Violation Type', 'Delete violation type'],
            // Violation Level
            ['violation_level.view', 'View Violation Levels', 'View violation levels'],
            ['violation_level.create', 'Create Violation Level', 'Add violation level'],
            ['violation_level.update', 'Update Violation Level', 'Edit violation level'],
            ['violation_level.delete', 'Delete Violation Level', 'Delete violation level'],
            // Student Violation
            ['student_violation.view', 'View Student Violations', 'View student violations'],
            ['student_violation.create', 'Create Student Violation', 'Record student violation'],
            ['student_violation.update', 'Update Student Violation', 'Edit student violation'],
            ['student_violation.delete', 'Delete Student Violation', 'Delete student violation'],
            ['student_violation.approve', 'Approve Student Violation', 'Approve/reject violation'],
            // Positive Point Type
            ['positive_point_type.view', 'View Positive Point Types', 'View positive point types'],
            ['positive_point_type.create', 'Create Positive Point Type', 'Add positive point type'],
            ['positive_point_type.update', 'Update Positive Point Type', 'Edit positive point type'],
            ['positive_point_type.delete', 'Delete Positive Point Type', 'Delete positive point type'],
            // Student Positive Point
            ['student_positive_point.view', 'View Student Positive Points', 'View positive points'],
            ['student_positive_point.create', 'Create Student Positive Point', 'Record positive point'],
            ['student_positive_point.update', 'Update Student Positive Point', 'Edit positive point'],
            ['student_positive_point.delete', 'Delete Student Positive Point', 'Delete positive point'],
            // Counseling Case
            ['counseling_case.view', 'View Counseling Cases', 'View counseling cases'],
            ['counseling_case.create', 'Create Counseling Case', 'Open counseling case'],
            ['counseling_case.update', 'Update Counseling Case', 'Edit counseling case'],
            ['counseling_case.delete', 'Delete Counseling Case', 'Delete counseling case'],
            // Counseling Session
            ['counseling_session.view', 'View Counseling Sessions', 'View counseling sessions'],
            ['counseling_session.create', 'Create Counseling Session', 'Add counseling session'],
            ['counseling_session.update', 'Update Counseling Session', 'Edit counseling session'],
            ['counseling_session.delete', 'Delete Counseling Session', 'Delete counseling session'],
            // Counseling Followup
            ['counseling_followup.view', 'View Counseling Followups', 'View followup actions'],
            ['counseling_followup.create', 'Create Counseling Followup', 'Add followup action'],
            ['counseling_followup.update', 'Update Counseling Followup', 'Edit followup action'],
            ['counseling_followup.delete', 'Delete Counseling Followup', 'Delete followup action'],
            // Character Report
            ['character_report.view', 'View Character Reports', 'View character reports'],
            // Guestbook
            ['guestbook.view', 'View Guestbook', 'View guestbook entries'],
            ['guestbook.create', 'Create Guestbook Entry', 'Add guestbook entry'],
            ['guestbook.update', 'Update Guestbook Entry', 'Edit guestbook entry'],
            ['guestbook.delete', 'Delete Guestbook Entry', 'Delete guestbook entry'],
            // Permission Letter
            ['permission_letter.view', 'View Permission Letters', 'View permission letters'],
            ['permission_letter.create', 'Create Permission Letter', 'Create permission letter'],
            ['permission_letter.update', 'Update Permission Letter', 'Edit permission letter'],
            ['permission_letter.delete', 'Delete Permission Letter', 'Delete permission letter'],
            ['permission_letter.approve', 'Approve Permission Letter', 'Approve/reject permission letter'],
            // Incoming Mail
            ['incoming_mail.view', 'View Incoming Mail', 'View incoming mail'],
            ['incoming_mail.create', 'Create Incoming Mail', 'Add incoming mail'],
            ['incoming_mail.update', 'Update Incoming Mail', 'Edit incoming mail'],
            ['incoming_mail.delete', 'Delete Incoming Mail', 'Delete incoming mail'],
            // Outgoing Mail
            ['outgoing_mail.view', 'View Outgoing Mail', 'View outgoing mail'],
            ['outgoing_mail.create', 'Create Outgoing Mail', 'Add outgoing mail'],
            ['outgoing_mail.update', 'Update Outgoing Mail', 'Edit outgoing mail'],
            ['outgoing_mail.delete', 'Delete Outgoing Mail', 'Delete outgoing mail'],
            // Mail Disposition
            ['mail_disposition.view', 'View Mail Dispositions', 'View mail dispositions'],
            ['mail_disposition.create', 'Create Mail Disposition', 'Add mail disposition'],
            ['mail_disposition.update', 'Update Mail Disposition', 'Edit mail disposition'],
            ['mail_disposition.delete', 'Delete Mail Disposition', 'Delete mail disposition'],
            // User Management
            ['user.view', 'View Users', 'View user list and detail'],
            ['user.create', 'Create User', 'Add new user'],
            ['user.update', 'Update User', 'Edit user data'],
            ['user.delete', 'Delete User', 'Delete user'],
            ['user.reset_password', 'Reset User Password', 'Reset user password'],
            ['user.assign_role', 'Assign Role to User', 'Assign roles to user'],
            // Role Management
            ['role.view', 'View Roles', 'View role list and detail'],
            ['role.create', 'Create Role', 'Add new role'],
            ['role.update', 'Update Role', 'Edit role'],
            ['role.delete', 'Delete Role', 'Delete role'],
            ['role.assign_permission', 'Assign Permission to Role', 'Assign permissions to role'],
            // Permission Management
            ['permission.view', 'View Permissions', 'View permission list'],
            ['permission.create', 'Create Permission', 'Add new permission'],
            ['permission.update', 'Update Permission', 'Edit permission'],
            ['permission.delete', 'Delete Permission', 'Delete permission'],
            // Menu Management
            ['menu.view', 'View Menus', 'View menu structure'],
            ['menu.manage', 'Manage Menus', 'Manage menu visibility and permissions']
        ];

        const permissions = permDefs.map(([code, name, description]) => ({
            code, name, description, created_at: now
        }));

        await queryInterface.bulkInsert('permissions', permissions, { ignoreDuplicates: true });

        // ─── 3. SUPERADMIN USER ───────────────────────────────────────────────
        const passwordHash = await bcrypt.hash('password123', 10);
        await queryInterface.bulkInsert('users', [{
            name: 'Super Admin',
            email: 'admin@edulite.local',
            password_hash: passwordHash,
            is_active: true,
            created_at: now,
            updated_at: now
        }], { ignoreDuplicates: true });

        // ─── 4. FETCH IDs DYNAMICALLY ─────────────────────────────────────────
        const [roles] = await queryInterface.sequelize.query(
            `SELECT id, name FROM roles WHERE name IN ('SUPERADMIN','ADMIN','GURU','SISWA','ORTU')`
        );
        const roleMap = {};
        for (const r of roles) roleMap[r.name] = r.id;

        const [users] = await queryInterface.sequelize.query(
            `SELECT id FROM users WHERE email = 'admin@edulite.local' LIMIT 1`
        );
        const adminUserId = users[0]?.id;

        if (adminUserId && roleMap['SUPERADMIN']) {
            await queryInterface.bulkInsert('user_roles', [
                { user_id: adminUserId, role_id: roleMap['SUPERADMIN'] }
            ], { ignoreDuplicates: true });
        }

        // ─── 5. ROLE PERMISSIONS ──────────────────────────────────────────────
        const [allPerms] = await queryInterface.sequelize.query(`SELECT id, code FROM permissions`);
        const permMap = {};
        for (const p of allPerms) permMap[p.code] = p.id;

        const adminCodes = [
            'dashboard.view',
            'student.view','student.create','student.update','student.delete','student.export','student.import',
            'parent.view','parent.create','parent.update','parent.delete',
            'student_document.view','student_document.create','student_document.update','student_document.delete',
            'class_history.view','class_history.create','class_history.update','class_history.delete',
            'student_transfer.view','student_transfer.create','student_transfer.update','student_transfer.delete',
            'id_card.view','id_card.manage',
            'academic_year.view','academic_year.create','academic_year.update','academic_year.delete',
            'grade.view','grade.create','grade.update','grade.delete',
            'department.view','department.create','department.update','department.delete',
            'class.view','class.create','class.update','class.delete',
            'teacher.view','teacher.create','teacher.update','teacher.delete',
            'achievement.view','achievement.create','achievement.update','achievement.delete',
            'achievement_participant.view','achievement_participant.create','achievement_participant.update','achievement_participant.delete',
            'achievement_result.view','achievement_result.create','achievement_result.update','achievement_result.delete',
            'achievement_point_rule.view','achievement_point_rule.create','achievement_point_rule.update','achievement_point_rule.delete',
            'certificate.view','certificate.manage',
            'violation_type.view','violation_type.create','violation_type.update','violation_type.delete',
            'violation_level.view','violation_level.create','violation_level.update','violation_level.delete',
            'student_violation.view','student_violation.create','student_violation.update','student_violation.delete','student_violation.approve',
            'positive_point_type.view','positive_point_type.create','positive_point_type.update','positive_point_type.delete',
            'student_positive_point.view','student_positive_point.create','student_positive_point.update','student_positive_point.delete',
            'counseling_case.view','counseling_case.create','counseling_case.update','counseling_case.delete',
            'counseling_session.view','counseling_session.create','counseling_session.update','counseling_session.delete',
            'counseling_followup.view','counseling_followup.create','counseling_followup.update','counseling_followup.delete',
            'character_report.view',
            'guestbook.view','guestbook.create','guestbook.update','guestbook.delete',
            'permission_letter.view','permission_letter.create','permission_letter.update','permission_letter.delete','permission_letter.approve',
            'incoming_mail.view','incoming_mail.create','incoming_mail.update','incoming_mail.delete',
            'outgoing_mail.view','outgoing_mail.create','outgoing_mail.update','outgoing_mail.delete',
            'mail_disposition.view','mail_disposition.create','mail_disposition.update','mail_disposition.delete',
            'user.view','user.create','user.update','user.reset_password','user.assign_role',
            'role.view','role.create','role.update','role.assign_permission',
            'permission.view',
            'menu.view','menu.manage'
        ];

        const guruCodes = [
            'dashboard.view',
            'student.view','parent.view','student_document.view','class_history.view','id_card.view',
            'academic_year.view','grade.view','department.view','class.view','teacher.view',
            'achievement.view','achievement.create','achievement.update',
            'achievement_participant.view','achievement_participant.create','achievement_participant.update',
            'achievement_result.view','achievement_result.create','achievement_result.update',
            'certificate.view',
            'violation_type.view','violation_level.view',
            'student_violation.view','student_violation.create','student_violation.update',
            'positive_point_type.view',
            'student_positive_point.view','student_positive_point.create','student_positive_point.update',
            'counseling_case.view','counseling_case.create','counseling_case.update',
            'counseling_session.view','counseling_session.create','counseling_session.update',
            'counseling_followup.view','counseling_followup.create','counseling_followup.update',
            'character_report.view',
            'guestbook.view','guestbook.create',
            'permission_letter.view','permission_letter.create','permission_letter.update'
        ];

        const siswaCodes = [
            'dashboard.view','achievement.view','certificate.view',
            'student_violation.view','student_positive_point.view',
            'counseling_case.view','character_report.view'
        ];

        const ortuCodes = [
            'dashboard.view','student.view','achievement.view','certificate.view',
            'student_violation.view','student_positive_point.view','character_report.view'
        ];

        const buildRP = (roleId, codes) => codes
            .filter(c => permMap[c] && roleId)
            .map(c => ({ role_id: roleId, permission_id: permMap[c] }));

        const rpRecords = [
            ...buildRP(roleMap['ADMIN'], adminCodes),
            ...buildRP(roleMap['GURU'], guruCodes),
            ...buildRP(roleMap['SISWA'], siswaCodes),
            ...buildRP(roleMap['ORTU'], ortuCodes)
        ];

        if (rpRecords.length > 0) {
            await queryInterface.bulkInsert('role_permissions', rpRecords, { ignoreDuplicates: true });
        }

        // ─── 6. MENU GROUPS ───────────────────────────────────────────────────
        await queryInterface.bulkInsert('menu_groups', [
            { name: 'Manajemen Siswa', icon: 'users', sort_order: 1, created_at: now },
            { name: 'Akademik', icon: 'academic-cap', sort_order: 2, created_at: now },
            { name: 'Prestasi & Kegiatan', icon: 'star', sort_order: 3, created_at: now },
            { name: 'Disiplin & Konseling', icon: 'shield-check', sort_order: 4, created_at: now },
            { name: 'Administrasi', icon: 'office-building', sort_order: 5, created_at: now },
            { name: 'Sistem', icon: 'cog', sort_order: 6, created_at: now }
        ], { ignoreDuplicates: true });

        // ─── 7. MENUS ─────────────────────────────────────────────────────────
        const [groups] = await queryInterface.sequelize.query(
            `SELECT id, name FROM menu_groups ORDER BY sort_order ASC`
        );
        const groupMap = {};
        for (const g of groups) groupMap[g.name] = g.id;

        const menuDefs = [
            // Manajemen Siswa
            { group: 'Manajemen Siswa', name: 'Data Siswa', route: '/students', icon: 'user', permission_code: 'student.view', sort_order: 1 },
            { group: 'Manajemen Siswa', name: 'Orang Tua / Wali', route: '/parents', icon: 'users', permission_code: 'parent.view', sort_order: 2 },
            { group: 'Manajemen Siswa', name: 'Dokumen Siswa', route: '/student-docs', icon: 'document', permission_code: 'student_document.view', sort_order: 3 },
            { group: 'Manajemen Siswa', name: 'Riwayat Kelas', route: '/class-history', icon: 'clock', permission_code: 'class_history.view', sort_order: 4 },
            { group: 'Manajemen Siswa', name: 'Mutasi Siswa', route: '/transfers', icon: 'switch-horizontal', permission_code: 'student_transfer.view', sort_order: 5 },
            { group: 'Manajemen Siswa', name: 'Kartu Pelajar', route: '/id-cards', icon: 'identification', permission_code: 'id_card.view', sort_order: 6 },
            // Akademik
            { group: 'Akademik', name: 'Tahun Ajaran', route: '/academic-years', icon: 'calendar', permission_code: 'academic_year.view', sort_order: 1 },
            { group: 'Akademik', name: 'Tingkat Kelas', route: '/grades', icon: 'chart-bar', permission_code: 'grade.view', sort_order: 2 },
            { group: 'Akademik', name: 'Jurusan', route: '/departments', icon: 'library', permission_code: 'department.view', sort_order: 3 },
            { group: 'Akademik', name: 'Kelas', route: '/classes', icon: 'collection', permission_code: 'class.view', sort_order: 4 },
            { group: 'Akademik', name: 'Data Guru', route: '/teachers', icon: 'academic-cap', permission_code: 'teacher.view', sort_order: 5 },
            // Prestasi & Kegiatan
            { group: 'Prestasi & Kegiatan', name: 'Data Prestasi', route: '/achievements', icon: 'trophy', permission_code: 'achievement.view', sort_order: 1 },
            { group: 'Prestasi & Kegiatan', name: 'Peserta Prestasi', route: '/achievement-participants', icon: 'user-group', permission_code: 'achievement_participant.view', sort_order: 2 },
            { group: 'Prestasi & Kegiatan', name: 'Hasil Prestasi', route: '/achievement-results', icon: 'chart-pie', permission_code: 'achievement_result.view', sort_order: 3 },
            { group: 'Prestasi & Kegiatan', name: 'Aturan Poin', route: '/achievement-point-rules', icon: 'calculator', permission_code: 'achievement_point_rule.view', sort_order: 4 },
            { group: 'Prestasi & Kegiatan', name: 'Piagam / Sertifikat', route: '/certificates', icon: 'badge-check', permission_code: 'certificate.view', sort_order: 5 },
            // Disiplin & Konseling
            { group: 'Disiplin & Konseling', name: 'Jenis Pelanggaran', route: '/violation-types', icon: 'exclamation', permission_code: 'violation_type.view', sort_order: 1 },
            { group: 'Disiplin & Konseling', name: 'Level Pelanggaran', route: '/violation-levels', icon: 'adjustments', permission_code: 'violation_level.view', sort_order: 2 },
            { group: 'Disiplin & Konseling', name: 'Data Pelanggaran Siswa', route: '/student-violations', icon: 'ban', permission_code: 'student_violation.view', sort_order: 3 },
            { group: 'Disiplin & Konseling', name: 'Jenis Catatan Positif', route: '/positive-point-types', icon: 'thumb-up', permission_code: 'positive_point_type.view', sort_order: 4 },
            { group: 'Disiplin & Konseling', name: 'Catatan Positif Siswa', route: '/student-positive-points', icon: 'sparkles', permission_code: 'student_positive_point.view', sort_order: 5 },
            { group: 'Disiplin & Konseling', name: 'Kasus Konseling', route: '/counseling-cases', icon: 'chat-alt-2', permission_code: 'counseling_case.view', sort_order: 6 },
            { group: 'Disiplin & Konseling', name: 'Tindak Lanjut Konseling', route: '/counseling-followups', icon: 'arrow-circle-right', permission_code: 'counseling_followup.view', sort_order: 7 },
            { group: 'Disiplin & Konseling', name: 'Rapor Karakter', route: '/character-reports', icon: 'clipboard-list', permission_code: 'character_report.view', sort_order: 8 },
            // Administrasi
            { group: 'Administrasi', name: 'Buku Tamu', route: '/guestbooks', icon: 'book-open', permission_code: 'guestbook.view', sort_order: 1 },
            { group: 'Administrasi', name: 'Surat Izin Siswa', route: '/permission-letters', icon: 'mail', permission_code: 'permission_letter.view', sort_order: 2 },
            { group: 'Administrasi', name: 'Surat Masuk', route: '/incoming-mail', icon: 'inbox', permission_code: 'incoming_mail.view', sort_order: 3 },
            { group: 'Administrasi', name: 'Surat Keluar', route: '/outgoing-mail', icon: 'paper-airplane', permission_code: 'outgoing_mail.view', sort_order: 4 },
            { group: 'Administrasi', name: 'Disposisi Surat', route: '/mail-disposition', icon: 'reply', permission_code: 'mail_disposition.view', sort_order: 5 },
            // Sistem
            { group: 'Sistem', name: 'Manajemen Pengguna', route: '/users', icon: 'user-circle', permission_code: 'user.view', sort_order: 1 },
            { group: 'Sistem', name: 'Manajemen Role', route: '/roles', icon: 'shield', permission_code: 'role.view', sort_order: 2 },
            { group: 'Sistem', name: 'Hak Akses', route: '/permissions', icon: 'key', permission_code: 'permission.view', sort_order: 3 }
        ];

        const menuRows = menuDefs
            .filter(m => groupMap[m.group])
            .map(m => ({
                group_id: groupMap[m.group],
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

        // ─── 8. MENU PERMISSIONS ──────────────────────────────────────────────
        const [menus] = await queryInterface.sequelize.query(
            `SELECT id, permission_code FROM menus WHERE permission_code IS NOT NULL`
        );

        const menuPermRows = [];
        for (const menu of menus) {
            const permId = permMap[menu.permission_code];
            if (permId) {
                menuPermRows.push({ menu_id: menu.id, permission_id: permId });
            }
        }

        if (menuPermRows.length > 0) {
            await queryInterface.bulkInsert('menu_permissions', menuPermRows, { ignoreDuplicates: true });
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('menu_permissions', null, {});
        await queryInterface.bulkDelete('menus', null, {});
        await queryInterface.bulkDelete('menu_groups', null, {});
        await queryInterface.bulkDelete('role_permissions', null, {});
        await queryInterface.bulkDelete('user_roles', null, {});
        await queryInterface.bulkDelete('permissions', null, {});
    }
};
