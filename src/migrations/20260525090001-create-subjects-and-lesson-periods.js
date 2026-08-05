'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('subjects', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            code: {
                type: Sequelize.STRING(30),
                allowNull: false,
                unique: true
            },
            name: {
                type: Sequelize.STRING(150),
                allowNull: false
            },
            subject_type: {
                type: Sequelize.STRING(30),
                allowNull: false
            },
            department_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'departments', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
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

        await queryInterface.addIndex('subjects', ['code'], { unique: true });
        await queryInterface.addIndex('subjects', ['name']);
        await queryInterface.addIndex('subjects', ['subject_type']);
        await queryInterface.addIndex('subjects', ['department_id']);
        await queryInterface.addIndex('subjects', ['is_active']);

        await queryInterface.createTable('lesson_period_templates', {
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
                allowNull: false,
                unique: true
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            is_default: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
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

        await queryInterface.addIndex('lesson_period_templates', ['code'], { unique: true });
        await queryInterface.addIndex('lesson_period_templates', ['is_default']);
        await queryInterface.addIndex('lesson_period_templates', ['is_active']);

        await queryInterface.createTable('lesson_periods', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            template_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'lesson_period_templates', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            period_order: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            period_number: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            period_type: {
                type: Sequelize.STRING(30),
                allowNull: false
            },
            start_time: {
                type: Sequelize.TIME,
                allowNull: false
            },
            end_time: {
                type: Sequelize.TIME,
                allowNull: false
            },
            is_attendance_enabled: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
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

        await queryInterface.addIndex('lesson_periods', ['template_id', 'period_order'], { unique: true });
        await queryInterface.addIndex('lesson_periods', ['template_id', 'period_number']);
        await queryInterface.addIndex('lesson_periods', ['period_type']);
        await queryInterface.addIndex('lesson_periods', ['is_active']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('lesson_periods');
        await queryInterface.dropTable('lesson_period_templates');
        await queryInterface.dropTable('subjects');
    }
};

