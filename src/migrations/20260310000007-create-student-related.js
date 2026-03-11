'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('parent_profiles', {
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
            type: {
                type: Sequelize.STRING(20)
            },
            full_name: {
                type: Sequelize.STRING(100)
            },
            nik: {
                type: Sequelize.STRING(30)
            },
            phone: {
                type: Sequelize.STRING(30)
            },
            email: {
                type: Sequelize.STRING(100)
            },
            occupation: {
                type: Sequelize.STRING(100)
            },
            education: {
                type: Sequelize.STRING(100)
            },
            is_guardian: {
                type: Sequelize.BOOLEAN
            },
            address: {
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

        await queryInterface.createTable('document_types', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            code: {
                type: Sequelize.STRING(50)
            },
            name: {
                type: Sequelize.STRING(100)
            },
            required: {
                type: Sequelize.BOOLEAN
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

        await queryInterface.createTable('student_documents', {
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
            document_type_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'document_types', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            document_number: {
                type: Sequelize.STRING(100)
            },
            issued_date: {
                type: Sequelize.DATEONLY
            },
            document_file: {
                type: Sequelize.STRING(255)
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
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('student_documents');
        await queryInterface.dropTable('document_types');
        await queryInterface.dropTable('parent_profiles');
    }
};
