'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('menu_groups', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING(100)
            },
            icon: {
                type: Sequelize.STRING(50)
            },
            sort_order: {
                type: Sequelize.INTEGER
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        await queryInterface.createTable('menus', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            group_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'menu_groups', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            parent_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'menus', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            name: {
                type: Sequelize.STRING(100)
            },
            route: {
                type: Sequelize.STRING(100)
            },
            icon: {
                type: Sequelize.STRING(50)
            },
            permission_code: {
                type: Sequelize.STRING(100)
            },
            sort_order: {
                type: Sequelize.INTEGER
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        await queryInterface.createTable('menu_permissions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            menu_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'menus', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            permission_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'permissions', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('menu_permissions');
        await queryInterface.dropTable('menus');
        await queryInterface.dropTable('menu_groups');
    }
};
