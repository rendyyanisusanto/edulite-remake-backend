const { User, Role, Permission } = require('./src/models');

async function test() {
    try {
        const user = await User.findOne({ 
            where: { email: 'rendyyanisusanto@gmail.com' },
            include: [{
                model: Role,
                as: 'roles',
                include: [{
                    model: Permission,
                    as: 'permissions'
                }]
            }]
        });
        
        if (!user) {
            console.log('User not found');
            return;
        }
        
        console.log('User roles:', user.roles.map(r => r.name));
        const perms = [];
        for (const role of user.roles) {
            for (const perm of role.permissions || []) {
                perms.push(perm.code);
            }
        }
        console.log('User permissions:', perms);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

test();
