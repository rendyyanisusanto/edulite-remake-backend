'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('school_profiles', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING(150),
                allowNull: false
            },
            short_name: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            npsn: {
                type: Sequelize.STRING(30),
                allowNull: true
            },
            nss: {
                type: Sequelize.STRING(30),
                allowNull: true
            },
            level: {
                type: Sequelize.STRING(30),
                allowNull: true
            },
            status: {
                type: Sequelize.STRING(30),
                allowNull: true
            },
            foundation_name: {
                type: Sequelize.STRING(150),
                allowNull: true
            },
            phone: {
                type: Sequelize.STRING(30),
                allowNull: true
            },
            email: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            website: {
                type: Sequelize.STRING(150),
                allowNull: true
            },
            address: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            village: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            district: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            city: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            province: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            postal_code: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            logo: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            logo_light: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            logo_dark: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            favicon: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            school_icon: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            principal_name: {
                type: Sequelize.STRING(150),
                allowNull: true
            },
            principal_title: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            principal_nip: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            acting_principal_name: {
                type: Sequelize.STRING(150),
                allowNull: true
            },
            acting_principal_title: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            acting_principal_nip: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
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
        await queryInterface.dropTable('school_profiles');
    }
};
