'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('parent_documents', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            parent_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'parent_profiles', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            document_type: {
                type: Sequelize.STRING(30)
            },
            document_file: {
                type: Sequelize.STRING(255)
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('parent_documents');
    }
};
