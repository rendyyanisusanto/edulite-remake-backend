'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('achievements', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            title: {
                type: Sequelize.STRING(150)
            },
            level: {
                type: Sequelize.STRING(50)
            },
            organizer: {
                type: Sequelize.STRING(150)
            },
            location: {
                type: Sequelize.STRING(150)
            },
            event_type: {
                type: Sequelize.STRING(50)
            },
            event_date: {
                type: Sequelize.DATEONLY
            },
            description: {
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

        await queryInterface.createTable('achievement_participants', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            achievement_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'achievements', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            student_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'students', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            teacher_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'teachers', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            role: {
                type: Sequelize.STRING(50)
            },
            notes: {
                type: Sequelize.STRING(255)
            }
        });

        await queryInterface.createTable('achievement_results', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            participant_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'achievement_participants', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            rank: {
                type: Sequelize.STRING(50)
            },
            score: {
                type: Sequelize.STRING(50)
            },
            category: {
                type: Sequelize.STRING(100)
            },
            certificate_file: {
                type: Sequelize.STRING(255)
            },
            notes: {
                type: Sequelize.TEXT
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('achievement_results');
        await queryInterface.dropTable('achievement_participants');
        await queryInterface.dropTable('achievements');
    }
};
