'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('positive_point_types', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING(100)
            },
            category: {
                type: Sequelize.STRING(50)
            },
            points: {
                type: Sequelize.INTEGER
            },
            description: {
                type: Sequelize.TEXT
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        await queryInterface.createTable('student_positive_points', {
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
                references: { model: 'positive_point_types', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            academic_year_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'academic_years', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            date: {
                type: Sequelize.DATEONLY
            },
            location: {
                type: Sequelize.STRING(100)
            },
            points: {
                type: Sequelize.INTEGER
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
        await queryInterface.dropTable('student_positive_points');
        await queryInterface.dropTable('positive_point_types');
    }
};
