'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableName = 'extracurricular_coaches';
        const transaction = await queryInterface.sequelize.transaction();

        try {
            await queryInterface.sequelize.query(
                `
                UPDATE extracurricular_coaches ec
                LEFT JOIN teachers t ON t.id = ec.teacher_id
                SET ec.user_id = COALESCE(ec.user_id, t.user_id)
                WHERE ec.user_id IS NULL
                `,
                { transaction }
            );

            await queryInterface.sequelize.query(
                `
                UPDATE extracurricular_coaches
                SET teacher_id = NULL
                WHERE coach_type = 'EXTERNAL' AND teacher_id IS NOT NULL
                `,
                { transaction }
            );

            await queryInterface.sequelize.query(
                `
                UPDATE extracurricular_coaches ec
                JOIN teachers t ON t.user_id = ec.user_id
                SET ec.teacher_id = t.id
                WHERE ec.coach_type = 'INTERNAL' AND ec.teacher_id IS NULL
                `,
                { transaction }
            );

            const [invalidRows] = await queryInterface.sequelize.query(
                `SELECT id FROM extracurricular_coaches WHERE user_id IS NULL LIMIT 20`,
                { transaction }
            );
            if (invalidRows.length > 0) {
                throw new Error('Masih ada data extracurricular_coaches tanpa user_id. Perbaiki data ini sebelum migration dilanjutkan.');
            }

            const [duplicateRows] = await queryInterface.sequelize.query(
                `
                SELECT user_id, COUNT(*) AS total
                FROM extracurricular_coaches
                GROUP BY user_id
                HAVING COUNT(*) > 1
                LIMIT 20
                `,
                { transaction }
            );
            if (duplicateRows.length > 0) {
                throw new Error('Ditemukan duplikasi user_id pada extracurricular_coaches. Perbaiki data duplikat sebelum migration dilanjutkan.');
            }

            await queryInterface.changeColumn(tableName, 'teacher_id', {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'teachers', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }, { transaction });

            await queryInterface.changeColumn(tableName, 'user_id', {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            }, { transaction });

            const indexes = await queryInterface.showIndex(tableName, { transaction });
            const hasUniqueUserIdIndex = indexes.some(index => {
                const fields = (index.fields || []).map(field => field.attribute || field.name);
                return index.unique && fields.length === 1 && fields[0] === 'user_id';
            });

            if (!hasUniqueUserIdIndex) {
                await queryInterface.addIndex(tableName, ['user_id'], {
                    unique: true,
                    name: 'uq_extracurricular_coaches_user_id',
                    transaction
                });
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface) {
        const tableName = 'extracurricular_coaches';
        const indexes = await queryInterface.showIndex(tableName);
        const target = indexes.find(index => index.name === 'uq_extracurricular_coaches_user_id');

        if (target) {
            await queryInterface.removeIndex(tableName, 'uq_extracurricular_coaches_user_id');
        }
    }
};
