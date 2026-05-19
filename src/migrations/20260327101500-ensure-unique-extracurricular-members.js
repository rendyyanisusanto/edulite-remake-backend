'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const tableName = 'extracurricular_members';
        const indexName = 'uq_extracurricular_members_unique';
        const indexes = await queryInterface.showIndex(tableName);

        const hasTarget = indexes.some(index => index.name === indexName);
        if (!hasTarget) {
            await queryInterface.addIndex(tableName, ['extracurricular_id', 'student_id', 'academic_year_id'], {
                unique: true,
                name: indexName
            });
        }
    },

    async down(queryInterface) {
        const tableName = 'extracurricular_members';
        const indexName = 'uq_extracurricular_members_unique';
        const indexes = await queryInterface.showIndex(tableName);
        const hasTarget = indexes.some(index => index.name === indexName);

        if (hasTarget) {
            await queryInterface.removeIndex(tableName, indexName);
        }
    }
};
