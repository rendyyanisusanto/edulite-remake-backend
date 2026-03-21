'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('attendance_locations', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            code: {
                type: Sequelize.STRING(30),
                allowNull: true
            },
            latitude: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false
            },
            longitude: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false
            },
            radius_meters: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 100
            },
            location_type: {
                type: Sequelize.STRING(30),
                allowNull: true,
                comment: 'e.g. SCHOOL, BRANCH, REMOTE'
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('attendance_locations');
    }
};
