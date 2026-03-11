'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('violation_levels', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING(50)
            },
            min_point: {
                type: Sequelize.INTEGER
            },
            max_point: {
                type: Sequelize.INTEGER
            },
            description: {
                type: Sequelize.TEXT
            }
        });

        await queryInterface.createTable('violation_types', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            level_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'violation_levels', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            name: {
                type: Sequelize.STRING(100)
            },
            point: {
                type: Sequelize.INTEGER
            },
            description: {
                type: Sequelize.TEXT
            }
        });

        await queryInterface.createTable('student_violations', {
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
            type_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'violation_types', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            date: {
                type: Sequelize.DATEONLY
            },
            location: {
                type: Sequelize.STRING(100)
            },
            description: {
                type: Sequelize.TEXT
            },
            evidence_file: {
                type: Sequelize.STRING(255)
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
            approved_by: {
                type: Sequelize.INTEGER,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('student_violations');
        await queryInterface.dropTable('violation_types');
        await queryInterface.dropTable('violation_levels');
    }
};
