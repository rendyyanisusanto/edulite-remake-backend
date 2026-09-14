const db = require('../src/models');

async function fixUserPermissions() {
    try {
        console.log("Fixing DB consistency...");

        const user = await db.User.findOne({ where: { username: 'rys' } });
        const guruRole = await db.Role.findOne({ where: { name: 'GURU' } });

        if (!user || !guruRole) {
            console.log("User or Role GURU not found.");
            process.exit(1);
        }

        // Force relation User -> GURU
        await db.UserRole.findOrCreate({
            where: { user_id: user.id, role_id: guruRole.id }
        });
        console.log("Verified User 'rys' is linked to GURU.");

        // Force relation GURU -> Permissions
        const perms = await db.Permission.findAll({
            where: {
                code: {
                    [db.Sequelize.Op.in]: [
                        'cbt.question_bank.view',
                        'cbt.question_bank.create',
                        'cbt.question_bank.update',
                        'cbt.question_bank.archive',
                        'cbt.question.view',
                        'cbt.question.create',
                        'cbt.question.update',
                        'cbt.question.duplicate',
                        'cbt.question.archive'
                    ]
                }
            }
        });

        for (let p of perms) {
            await db.RolePermission.findOrCreate({
                where: { role_id: guruRole.id, permission_id: p.id }
            });
        }
        console.log(`Verified GURU role has ${perms.length} CBT permissions.`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fixUserPermissions();
