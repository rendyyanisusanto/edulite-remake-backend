'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'username', {
            type: Sequelize.STRING(50),
            allowNull: true,
            unique: true,
            after: 'name'
        });

        const [users] = await queryInterface.sequelize.query(
            'SELECT id, email FROM users ORDER BY id ASC'
        );

        const used = new Set();

        const slugify = (value) => String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9._-]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 50);

        for (const user of users) {
            const baseRaw = String(user.email || '').split('@')[0] || `user${user.id}`;
            const base = slugify(baseRaw) || `user${user.id}`;

            let candidate = base;
            let counter = 1;
            while (used.has(candidate)) {
                const suffix = `_${counter}`;
                candidate = `${base.slice(0, 50 - suffix.length)}${suffix}`;
                counter += 1;
            }

            used.add(candidate);

            await queryInterface.bulkUpdate(
                'users',
                { username: candidate },
                { id: user.id }
            );
        }

        await queryInterface.changeColumn('users', 'username', {
            type: Sequelize.STRING(50),
            allowNull: false,
            unique: true
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('users', 'username');
    }
};
