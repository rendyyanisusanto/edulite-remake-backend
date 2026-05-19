'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('teachers', 'photo', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'position'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('teachers', 'photo');
  }
};
