'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('student_violations', 'academic_year_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'academic_years',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('student_violations', 'academic_year_id');
  }
};
