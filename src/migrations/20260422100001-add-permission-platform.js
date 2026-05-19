'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('permissions', 'platform', {
            type: Sequelize.ENUM('WEB', 'MOBILE', 'BOTH'),
            allowNull: false,
            defaultValue: 'BOTH',
            after: 'description'
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('permissions', 'platform');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_permissions_platform";').catch(() => {});
    }
};
