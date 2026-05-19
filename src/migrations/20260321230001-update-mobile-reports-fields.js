'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Alter type_id to allow NULL in student_violations (using Raw SQL because of FK constraints bug in MySQL)
        await queryInterface.sequelize.query('ALTER TABLE `student_violations` MODIFY `type_id` INTEGER NULL;');

        // 2. Alter type_id to allow NULL in student_positive_points
        await queryInterface.sequelize.query('ALTER TABLE `student_positive_points` MODIFY `type_id` INTEGER NULL;');

        // 3. Add `photo` column to student_violations
        await queryInterface.addColumn('student_violations', 'photo', {
            type: Sequelize.STRING(255),
            allowNull: true
        });

        // 4. Add `photo` column to student_positive_points
        await queryInterface.addColumn('student_positive_points', 'photo', {
            type: Sequelize.STRING(255),
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        // Remove `photo` columns
        await queryInterface.removeColumn('student_positive_points', 'photo');
        await queryInterface.removeColumn('student_violations', 'photo');

        // Revert `type_id` back to NOT NULL (this might fail if there are rows with NULL values)
        try {
            await queryInterface.sequelize.query('ALTER TABLE `student_positive_points` MODIFY `type_id` INTEGER NOT NULL;');
            await queryInterface.sequelize.query('ALTER TABLE `student_violations` MODIFY `type_id` INTEGER NOT NULL;');
        } catch (err) {
            console.error("Down migration error (ignored):", err.message);
        }
    }
};
