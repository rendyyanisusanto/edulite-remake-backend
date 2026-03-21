'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('attendance_shifts', {
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
            clock_in_start: {
                type: Sequelize.TIME,
                allowNull: false
            },
            clock_in_end: {
                type: Sequelize.TIME,
                allowNull: false
            },
            clock_out_start: {
                type: Sequelize.TIME,
                allowNull: true
            },
            clock_out_end: {
                type: Sequelize.TIME,
                allowNull: true
            },
            late_after: {
                type: Sequelize.TIME,
                allowNull: true,
                comment: 'Time after which clock-in is considered late'
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

        await queryInterface.addIndex('attendance_shifts', ['is_active'], { name: 'idx_shifts_active' });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('attendance_shifts');
    }
};
