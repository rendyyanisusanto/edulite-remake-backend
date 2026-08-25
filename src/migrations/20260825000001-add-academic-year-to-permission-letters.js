'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('permission_letters', 'academic_year_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'academic_years', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            after: 'notes' // placed after notes column
        });

        await queryInterface.addIndex('permission_letters', ['academic_year_id'], {
            name: 'idx_permission_letters_academic_year_id'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('permission_letters', 'idx_permission_letters_academic_year_id');
        await queryInterface.removeColumn('permission_letters', 'academic_year_id');
    }
};
