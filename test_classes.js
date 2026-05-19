const { User, Role, Permission } = require('./src/models');

async function test() {
    try {
        // 1. Directly query classes from DB to see if they exist
        const { Class } = require('./src/models');
        console.log("Classes in DB:", await Class.count());

        // 2. Check permissions for the user
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
        
        let hasClassView = false;
        let perms = [];
        for (const role of user.roles) {
            for (const perm of role.permissions) {
                if (perm.code === 'class.view') hasClassView = true;
                perms.push(perm.code);
            }
        }
        console.log("User has class.view:", hasClassView);
        console.log("Perms:", perms);
        
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

test();
