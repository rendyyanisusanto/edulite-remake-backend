'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('teachers', {
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
            nip: {
                type: Sequelize.STRING(50)
            },
            position: {
                type: Sequelize.STRING(100)
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

        await queryInterface.createTable('academic_years', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING(50)
            },
            start_date: {
                type: Sequelize.DATEONLY
            },
            end_date: {
                type: Sequelize.DATEONLY
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
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

        await queryInterface.createTable('grades', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING(50)
            },
            level: {
                type: Sequelize.INTEGER
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

        await queryInterface.createTable('departments', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING(100)
            },
            code: {
                type: Sequelize.STRING(20)
            },
            description: {
                type: Sequelize.TEXT
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

        await queryInterface.createTable('classes', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            grade_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'grades', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            department_id: {
                type: Sequelize.INTEGER,
                references: { model: 'departments', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            name: {
                type: Sequelize.STRING(50)
            },
            homeroom_teacher_id: {
                type: Sequelize.INTEGER,
                references: { model: 'teachers', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            capacity: {
                type: Sequelize.INTEGER
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

        await queryInterface.createTable('student_class_history', {
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
            academic_year_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'academic_years', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            grade_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'grades', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            class_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'classes', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            assigned_by: {
                type: Sequelize.INTEGER,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            assignment_type: {
                type: Sequelize.STRING(20) // AUTO / MANUAL
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('student_class_history');
        await queryInterface.dropTable('classes');
        await queryInterface.dropTable('departments');
        await queryInterface.dropTable('grades');
        await queryInterface.dropTable('academic_years');
        await queryInterface.dropTable('teachers');
    }
};
