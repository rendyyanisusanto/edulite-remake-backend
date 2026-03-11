'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('counseling_cases', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            student_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'students', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            source: {
                type: Sequelize.STRING(30)
            },
            issue_title: {
                type: Sequelize.STRING(150)
            },
            issue_description: {
                type: Sequelize.TEXT
            },
            category: {
                type: Sequelize.STRING(50)
            },
            level: {
                type: Sequelize.STRING(20)
            },
            status: {
                type: Sequelize.STRING(30)
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

        await queryInterface.createTable('counseling_sessions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            case_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'counseling_cases', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            counselor_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            session_date: {
                type: Sequelize.DATE
            },
            method: {
                type: Sequelize.STRING(30)
            },
            duration: {
                type: Sequelize.INTEGER
            },
            notes: {
                type: Sequelize.TEXT
            },
            next_plan: {
                type: Sequelize.TEXT
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('counseling_sessions');
        await queryInterface.dropTable('counseling_cases');
    }
};
