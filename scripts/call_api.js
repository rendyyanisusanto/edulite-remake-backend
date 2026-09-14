async function run() {
    try {
        const jwt = require('jsonwebtoken');
        const db = require('../src/models');

        const user = await db.User.findOne({
            where: { username: 'rys' },
            include: [{ model: db.Role, as: 'roles' }]
        });

        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            roles: user.roles.map(r => r.name)
        };
        const token = jwt.sign(payload, 'edulite_secret', { expiresIn: '1d' });

        console.log('Token created:', token);

        const res = await fetch('http://127.0.0.1:5000/api/cbt/question-banks', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('STATUS:', res.status);
        const data = await res.json();
        console.log('BODY:', data);

    } catch (e) {
        console.error(e.message);
    }
}
run();
