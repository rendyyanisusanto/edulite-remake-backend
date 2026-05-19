'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        const tableNames = tables.map((table) => {
            if (typeof table === 'string') return table.toLowerCase();
            if (table && typeof table === 'object') {
                return String(table.tableName || table.TABLE_NAME || '').toLowerCase();
            }
            return '';
        });

        if (!tableNames.includes('student_mutation_logs')) {
            await queryInterface.createTable('student_mutation_logs', {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.INTEGER
                },
                mutation_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'student_mutations', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                action: {
                    type: Sequelize.STRING(30),
                    allowNull: false
                },
                action_note: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },
                action_by: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
                },
                created_at: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.fn('now')
                }
            });
        }

        await queryInterface.addIndex('student_mutation_logs', ['mutation_id'], {
            name: 'idx_mutation_logs_mutation_id'
        }).catch(() => null);

        await queryInterface.addIndex('student_mutation_logs', ['action', 'created_at'], {
            name: 'idx_mutation_logs_action_created_at'
        }).catch(() => null);
    },

    async down(queryInterface) {
        const tables = await queryInterface.showAllTables();
        const tableNames = tables.map((table) => {
            if (typeof table === 'string') return table.toLowerCase();
            if (table && typeof table === 'object') {
                return String(table.tableName || table.TABLE_NAME || '').toLowerCase();
            }
            return '';
        });
        if (!tableNames.includes('student_mutation_logs')) return;

        await queryInterface.removeIndex('student_mutation_logs', 'idx_mutation_logs_mutation_id').catch(() => null);
        await queryInterface.removeIndex('student_mutation_logs', 'idx_mutation_logs_action_created_at').catch(() => null);
        await queryInterface.dropTable('student_mutation_logs');
    }
};
