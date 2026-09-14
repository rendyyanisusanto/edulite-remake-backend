const db = require('../src/models');

async function run() {
    try {
        const users = await db.User.findAll({
            include: [{
                model: db.Role,
                as: 'roles',
                include: [{
                    model: db.Permission,
                    as: 'permissions'
                }]
            }]
        });

        for (let u of users) {
            console.log(`User: ${u.username} (ID: ${u.id})`);
            for (let r of u.roles) {
                console.log(`  Role: ${r.name}`);
                const cbtPerms = r.permissions.filter(p => p.code.startsWith('cbt.'));
                console.log(`    CBT Perms count: ${cbtPerms.length}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
