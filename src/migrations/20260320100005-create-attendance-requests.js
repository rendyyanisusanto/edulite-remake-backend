'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('attendance_requests', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            attendance_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'user_attendances', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            attendance_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            request_type: {
                type: Sequelize.STRING(30),
                allowNull: false,
                comment: 'CLOCK_IN, CLOCK_OUT, BOTH, CORRECTION'
            },
            request_status: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: 'PENDING',
                comment: 'PENDING, APPROVED, REJECTED'
            },
            requested_clock_in_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            requested_clock_out_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            requested_clock_in_note: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            requested_clock_out_note: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            reason: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            attachment_url: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            reviewed_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            reviewed_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            review_note: {
                type: Sequelize.TEXT,
                allowNull: true
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

        await queryInterface.addIndex('attendance_requests', ['user_id', 'attendance_date'], { name: 'idx_att_req_user_date' });
        await queryInterface.addIndex('attendance_requests', ['request_status'], { name: 'idx_att_req_status' });
        await queryInterface.addIndex('attendance_requests', ['request_type'], { name: 'idx_att_req_type' });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('attendance_requests');
    }
};
