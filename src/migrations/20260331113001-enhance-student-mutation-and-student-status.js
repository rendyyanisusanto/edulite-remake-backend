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

        const hasStudentsTable = tableNames.includes('students');
        const hasMutationsTable = tableNames.includes('student_mutations');

        if (hasStudentsTable) {
            const studentsDesc = await queryInterface.describeTable('students');
            if (!studentsDesc.student_status) {
                await queryInterface.addColumn('students', 'student_status', {
                    type: Sequelize.STRING(30),
                    allowNull: false,
                    defaultValue: 'ACTIVE'
                });
            }
        }

        if (!hasMutationsTable) {
            await queryInterface.createTable('student_mutations', {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.INTEGER
                },
                student_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'students', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
                },
                academic_year_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'academic_years', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                },
                mutation_type: {
                    type: Sequelize.STRING(10),
                    allowNull: false
                },
                mutation_category: {
                    type: Sequelize.STRING(30),
                    allowNull: false
                },
                mutation_date: {
                    type: Sequelize.DATEONLY,
                    allowNull: false
                },
                effective_date: {
                    type: Sequelize.DATEONLY,
                    allowNull: false
                },
                destination_school: {
                    type: Sequelize.STRING(150),
                    allowNull: true
                },
                origin_school: {
                    type: Sequelize.STRING(150),
                    allowNull: true
                },
                reason: {
                    type: Sequelize.TEXT,
                    allowNull: false
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },
                document_number: {
                    type: Sequelize.STRING(100),
                    allowNull: true
                },
                document_file: {
                    type: Sequelize.STRING(255),
                    allowNull: true
                },
                status: {
                    type: Sequelize.STRING(30),
                    allowNull: false,
                    defaultValue: 'DRAFT'
                },
                notes: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },
                approved_by: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'users', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                },
                approved_at: {
                    type: Sequelize.DATE,
                    allowNull: true
                },
                created_at: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.fn('now')
                },
                created_by: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
                },
                updated_at: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.fn('now')
                },
                updated_by: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'users', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                }
            });
        } else {
            const mutationDesc = await queryInterface.describeTable('student_mutations');
            if (!mutationDesc.academic_year_id) {
                await queryInterface.addColumn('student_mutations', 'academic_year_id', {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'academic_years', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                });
            }
        }

        await queryInterface.addIndex('student_mutations', ['student_id', 'status'], {
            name: 'idx_student_mutations_student_status'
        }).catch(() => null);

        await queryInterface.addIndex('student_mutations', ['mutation_type', 'status'], {
            name: 'idx_student_mutations_type_status'
        }).catch(() => null);

        await queryInterface.addIndex('student_mutations', ['mutation_date'], {
            name: 'idx_student_mutations_date'
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
        if (tableNames.includes('student_mutations')) {
            await queryInterface.removeIndex('student_mutations', 'idx_student_mutations_student_status').catch(() => null);
            await queryInterface.removeIndex('student_mutations', 'idx_student_mutations_type_status').catch(() => null);
            await queryInterface.removeIndex('student_mutations', 'idx_student_mutations_date').catch(() => null);
        }
        if (tableNames.includes('students')) {
            const studentsDesc = await queryInterface.describeTable('students');
            if (studentsDesc.student_status) {
                await queryInterface.removeColumn('students', 'student_status');
            }
        }
    }
};
