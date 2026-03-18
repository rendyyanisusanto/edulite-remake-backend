'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('permission_letters', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            code: {
                type: Sequelize.STRING(50),
                unique: true
            },
            activity_name: {
                type: Sequelize.STRING(150)
            },
            purpose: {
                type: Sequelize.TEXT
            },
            start_date: {
                type: Sequelize.DATEONLY
            },
            end_date: {
                type: Sequelize.DATEONLY
            },
            start_time: {
                type: Sequelize.TIME
            },
            end_time: {
                type: Sequelize.TIME
            },
            location: {
                type: Sequelize.STRING(150)
            },
            teacher_id: {
                type: Sequelize.INTEGER,
                references: { model: 'teachers', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            companion_name: {
                type: Sequelize.STRING(150)
            },
            status: {
                type: Sequelize.STRING(30),
                defaultValue: 'DRAFT'
            },
            notes: {
                type: Sequelize.TEXT
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            },
            created_by: {
                type: Sequelize.INTEGER,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            },
            updated_by: {
                type: Sequelize.INTEGER,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            approved_at: {
                type: Sequelize.DATE
            },
            approved_by: {
                type: Sequelize.INTEGER,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }
        });

        await queryInterface.createTable('permission_letter_students', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            permission_letter_id: {
                type: Sequelize.INTEGER,
                references: { model: 'permission_letters', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            student_id: {
                type: Sequelize.INTEGER,
                references: { model: 'students', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            notes: {
                type: Sequelize.STRING(255)
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        await queryInterface.addConstraint('permission_letter_students', {
            fields: ['permission_letter_id', 'student_id'],
            type: 'unique',
            name: 'unique_permission_letter_student'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('permission_letter_students');
        await queryInterface.dropTable('permission_letters');
    }
};
