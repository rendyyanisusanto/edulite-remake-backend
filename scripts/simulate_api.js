async function testApi() {
    try {
        const jwt = require('jsonwebtoken');
        const db = require('../src/models');

        // Find user rys
        const user = await db.User.findOne({
            where: { username: 'rys' },
            include: [{
                model: db.Role,
                as: 'roles'
            }]
        });

        if (!user) throw new Error('User rys not found');

        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            roles: user.roles.map(r => r.name)
        };
        // Use process.env.JWT_SECRET if loaded or 'edulite_secret'
        require('dotenv').config();
        const secret = process.env.JWT_SECRET || 'edulite_secret';
        const token = jwt.sign(payload, secret, { expiresIn: '1d' });

        console.log(`User ${user.username} roles:`, payload.roles);

        console.log('Sending token: Bearer ' + token);
        const req = await fetch('http://localhost:5000/api/cbt/question-banks', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await req.json();
        console.log("STATUS:", req.status);
        console.log("RESPONSE:", data);
        process.exit();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}
testApi();
