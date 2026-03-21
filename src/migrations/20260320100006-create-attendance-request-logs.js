'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('attendance_request_logs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            attendance_request_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'attendance_requests', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            action: {
                type: Sequelize.STRING(30),
                allowNull: false,
                comment: 'SUBMITTED, APPROVED, REJECTED, CANCELLED'
            },
            action_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            action_note: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        await queryInterface.addIndex('attendance_request_logs', ['attendance_request_id'], { name: 'idx_att_req_log_request' });
        await queryInterface.addIndex('attendance_request_logs', ['action_by'], { name: 'idx_att_req_log_actor' });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('attendance_request_logs');
    }
};
