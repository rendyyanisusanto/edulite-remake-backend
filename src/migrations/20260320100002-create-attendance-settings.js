'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('attendance_settings', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false,
                defaultValue: 'Default Setting'
            },
            center_lat: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false
            },
            center_lng: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: false
            },
            radius_meters: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 100
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            allow_outside_radius: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            require_selfie: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            require_note_outside_radius: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            min_gps_accuracy_meters: {
                type: Sequelize.DECIMAL(8, 2),
                allowNull: false,
                defaultValue: 100.00
            },
            clock_in_tolerance_minutes: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            clock_out_tolerance_minutes: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            active_shift_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'attendance_shifts', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
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
        await queryInterface.dropTable('attendance_settings');
    }
};
