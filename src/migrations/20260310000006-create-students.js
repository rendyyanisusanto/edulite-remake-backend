'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('card_templates', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING(100)
            },
            description: {
                type: Sequelize.TEXT
            },
            background_image: {
                type: Sequelize.STRING(255)
            },
            orientation: {
                type: Sequelize.STRING(20)
            },
            layout: {
                type: Sequelize.JSON
            },
            is_default: {
                type: Sequelize.BOOLEAN
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

        await queryInterface.createTable('students', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            nis: {
                type: Sequelize.STRING(50)
            },
            nisn: {
                type: Sequelize.STRING(50)
            },
            full_name: {
                type: Sequelize.STRING(100)
            },
            gender: {
                type: Sequelize.STRING(10)
            },
            date_of_birth: {
                type: Sequelize.DATEONLY
            },
            address: {
                type: Sequelize.TEXT
            },
            rfid_code: {
                type: Sequelize.STRING(100)
            },
            qr_code: {
                type: Sequelize.STRING(255)
            },
            barcode: {
                type: Sequelize.STRING(100)
            },
            card_template_id: {
                type: Sequelize.INTEGER,
                references: { model: 'card_templates', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            card_number: {
                type: Sequelize.STRING(100)
            },
            photo: {
                type: Sequelize.STRING(255)
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
        await queryInterface.dropTable('students');
        await queryInterface.dropTable('card_templates');
    }
};
