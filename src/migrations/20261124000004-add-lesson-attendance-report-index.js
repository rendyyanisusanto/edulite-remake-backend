'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const indexes = await queryInterface.showIndex('lesson_attendance_sessions');
    const exists = indexes.some((idx) => idx.name === 'idx_la_session_ay_date_cancel');
    if (!exists) {
      await queryInterface.addIndex(
        'lesson_attendance_sessions',
        ['academic_year_id', 'attendance_date', 'cancelled_at'],
        { name: 'idx_la_session_ay_date_cancel' }
      );
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('lesson_attendance_sessions');
    const exists = indexes.some((idx) => idx.name === 'idx_la_session_ay_date_cancel');
    if (exists) {
      await queryInterface.removeIndex('lesson_attendance_sessions', 'idx_la_session_ay_date_cancel');
    }
  }
};
