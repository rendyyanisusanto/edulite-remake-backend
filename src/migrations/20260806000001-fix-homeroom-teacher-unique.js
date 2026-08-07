'use strict';

/**
 * Migration untuk menghapus constraint unik pada homeroom_teacher_id
 * agar satu guru bisa menjadi wali kelas di lebih dari satu kelas
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Cek apakah ada unique index atau constraint pada homeroom_teacher_id
        // dan hapus jika ada

        // Untuk MySQL, kita perlu menghapus index unik jika ada
        try {
            // Hapus unique index jika ada (nama index mungkin bervariasi)
            await queryInterface.removeIndex('classes', 'classes_homeroom_teacher_id_unique').catch(() => {
                console.log('No unique index on homeroom_teacher_id found, continuing...');
            });
        } catch (error) {
            console.log('Error removing unique index (might not exist):', error.message);
        }
    },

    async down(queryInterface, Sequelize) {
        // Rollback: tidak perlu dilakukan karena kita ingin mengizinkan duplicate
    }
};
