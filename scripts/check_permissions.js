const db = require('../src/models');

async function run() {
    try {
        const roles = await db.Role.findAll({
            include: [{
                model: db.Permission,
                as: 'permissions'
            }]
        });

        for (let r of roles) {
            console.log(`Role: ${r.name}`);
            const cbtPerms = r.permissions.filter(p => p.code.startsWith('cbt.'));
            console.log(`  Memiliki ${cbtPerms.length} CBT permissions.`);
            if (cbtPerms.length > 0) {
                console.log(`  -> ${cbtPerms.map(p => p.code).join(', ')}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
