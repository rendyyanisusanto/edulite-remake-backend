'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Create achievement_point_rules table
        await queryInterface.createTable('achievement_point_rules', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            level: {
                type: Sequelize.STRING(50)
            },
            rank: {
                type: Sequelize.STRING(50)
            },
            category: {
                type: Sequelize.STRING(100)
            },
            points: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            description: {
                type: Sequelize.STRING(255)
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        // 2. Add academic_year_id to achievements
        await queryInterface.addColumn('achievements', 'academic_year_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'academic_years', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

        // 3. Add point_rule_id & points to achievement_results
        await queryInterface.addColumn('achievement_results', 'point_rule_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'achievement_point_rules', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

        await queryInterface.addColumn('achievement_results', 'points', {
            type: Sequelize.INTEGER,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('achievement_results', 'points');
        await queryInterface.removeColumn('achievement_results', 'point_rule_id');
        await queryInterface.removeColumn('achievements', 'academic_year_id');
        await queryInterface.dropTable('achievement_point_rules');
    }
};
