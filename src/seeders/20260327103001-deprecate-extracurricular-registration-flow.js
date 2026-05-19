'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            UPDATE permissions
            SET description = CONCAT('[DEPRECATED] ', description)
            WHERE code IN (
                'extracurricular.registration.view',
                'extracurricular.registration.create',
                'extracurricular.registration.approve',
                'extracurricular.registration.reject'
            )
            AND description NOT LIKE '[DEPRECATED] %'
        `);

        await queryInterface.sequelize.query(`
            DELETE mp FROM menu_permissions mp
            JOIN menus m ON m.id = mp.menu_id
            WHERE m.route IN ('/extracurricular/registrations', '/extracurricular/assignments')
        `);

        await queryInterface.sequelize.query(`
            DELETE FROM menus
            WHERE route IN ('/extracurricular/registrations', '/extracurricular/assignments')
        `);
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            UPDATE permissions
            SET description = REPLACE(description, '[DEPRECATED] ', '')
            WHERE code IN (
                'extracurricular.registration.view',
                'extracurricular.registration.create',
                'extracurricular.registration.approve',
                'extracurricular.registration.reject'
            )
        `);
    }
};
