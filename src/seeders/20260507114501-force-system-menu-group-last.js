'use strict';

module.exports = {
  async up(queryInterface) {
    // Put "Sistem" group at bottom by giving very large sort_order.
    await queryInterface.sequelize.query(`
      UPDATE menu_groups
      SET sort_order = 9999
      WHERE LOWER(name) IN ('sistem', 'system')
    `);

    // Optional normalization: keep other groups below 9999 to avoid collisions.
    await queryInterface.sequelize.query(`
      UPDATE menu_groups
      SET sort_order = COALESCE(sort_order, 0)
      WHERE LOWER(name) NOT IN ('sistem', 'system')
        AND COALESCE(sort_order, 0) >= 9999
    `);
  },

  async down(queryInterface) {
    // Safe rollback: set back to conventional high (but not fixed) value.
    await queryInterface.sequelize.query(`
      UPDATE menu_groups
      SET sort_order = 100
      WHERE LOWER(name) IN ('sistem', 'system')
    `);
  }
};
