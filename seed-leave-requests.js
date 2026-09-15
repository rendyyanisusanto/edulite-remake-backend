const db = require('./src/models');
const { Sequelize } = db;

async function seed() {
    try {
        console.log('Seeding permissions...');
        const permissions = [
            { name: 'View Student Leave Requests', code: 'counseling.leave_requests.view', description: 'Lihat data perijinan siswa' },
            { name: 'Create Student Leave Request', code: 'counseling.leave_requests.create', description: 'Buat pengajuan perijinan siswa' },
            { name: 'Update Student Leave Request', code: 'counseling.leave_requests.update', description: 'Edit data perijinan siswa' },
            { name: 'Delete Student Leave Request', code: 'counseling.leave_requests.delete', description: 'Hapus data perijinan siswa' },
            { name: 'Approve/Reject Student Leave Request', code: 'counseling.leave_requests.approve', description: 'Persetujuan perijinan siswa' }
        ];

        for (const p of permissions) {
            await db.sequelize.query(`INSERT IGNORE INTO permissions (name, code, description) VALUES (?, ?, ?)`, {
                replacements: [p.name, p.code, p.description]
            });
        }

        console.log('Seeding menus...');
        const [groups] = await db.sequelize.query(`SELECT id FROM menu_groups WHERE name = 'Disiplin & Konseling' OR name = 'Disiplin dan Konseling' LIMIT 1;`);
        let groupId = groups.length > 0 ? groups[0].id : null;

        if (!groupId) {
            await db.sequelize.query(`INSERT INTO menu_groups (name, icon, sort_order) VALUES ('Disiplin & Konseling', 'HeroShieldCheck', 50)`);
            const [newGroups] = await db.sequelize.query(`SELECT id FROM menu_groups WHERE name = 'Disiplin & Konseling' LIMIT 1;`);
            groupId = newGroups[0].id;
        }

        await db.sequelize.query(`INSERT IGNORE INTO menus (group_id, name, route, icon, permission_code, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`, {
            replacements: [groupId, 'Perijinan Siswa', '/student-leave-requests', 'HeroDocumentText', 'counseling.leave_requests.view', 15, 1]
        });

        const [menus] = await db.sequelize.query(`SELECT id FROM menus WHERE route = '/student-leave-requests' LIMIT 1;`);
        const menuId = menus[0].id;

        console.log('Mapping permissions to menu...');
        const [insertedPermissions] = await db.sequelize.query(
            `SELECT id, code FROM permissions WHERE code IN (${permissions.map(p => `'${p.code}'`).join(',')});`
        );
        for (const p of insertedPermissions) {
            await db.sequelize.query(`INSERT IGNORE INTO menu_permissions (menu_id, permission_id) VALUES (?, ?)`, {
                replacements: [menuId, p.id]
            });
        }

        console.log('Mapping permissions to superadmin...');
        const [roles] = await db.sequelize.query(`SELECT id FROM roles WHERE code = 'superadmin' LIMIT 1;`);
        if (roles.length > 0) {
            const roleId = roles[0].id;
            for (const p of insertedPermissions) {
                await db.sequelize.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, {
                    replacements: [roleId, p.id]
                });
            }
        }
        console.log('Done!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
