'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add unique constraints to prevent duplicates
    try {
      await queryInterface.addIndex('roles', ['name'], { unique: true, name: 'unique_role_name' });
    } catch (e) {}

    try {
      await queryInterface.addIndex('menu_groups', ['name'], { unique: true, name: 'unique_menu_group_name' });
    } catch (e) {}

    try {
      // route might be enough, or name + group_id
      await queryInterface.addIndex('menus', ['route'], { unique: true, name: 'unique_menu_route' });
    } catch (e) {}
  },

  async down (queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('roles', 'unique_role_name');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('menu_groups', 'unique_menu_group_name');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('menus', 'unique_menu_route');
    } catch (e) {}
  }
};
