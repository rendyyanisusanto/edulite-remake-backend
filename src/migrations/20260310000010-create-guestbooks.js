'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('guestbooks', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            guest_name: {
                type: Sequelize.STRING(100)
            },
            guest_type: {
                type: Sequelize.STRING(30)
            },
            phone: {
                type: Sequelize.STRING(30)
            },
            address: {
                type: Sequelize.TEXT
            },
            purpose: {
                type: Sequelize.TEXT
            },
            related_person: {
                type: Sequelize.STRING(100)
            },
            visit_date: {
                type: Sequelize.DATEONLY
            },
            checkin_time: {
                type: Sequelize.DATE
            },
            checkout_time: {
                type: Sequelize.DATE
            },
            status: {
                type: Sequelize.STRING(20)
            },
            note: {
                type: Sequelize.TEXT
            },
            created_by: {
                type: Sequelize.INTEGER,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            updated_by: {
                type: Sequelize.INTEGER,
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
        await queryInterface.dropTable('guestbooks');
    }
};
