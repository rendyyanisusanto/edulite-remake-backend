'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('student_attendances', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            student_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'students',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            attendance_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA'),
                allowNull: false,
                defaultValue: 'HADIR'
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            input_method: {
                type: Sequelize.ENUM('rfid', 'manual', 'import'),
                allowNull: false,
                defaultValue: 'manual'
            },
            clock_in_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            clock_out_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            late_minutes: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        // Add unique constraint untuk mencegah duplikasi
        // Satu siswa hanya bisa punya satu absensi per tanggal
        await queryInterface.addConstraint('student_attendances', {
            type: 'unique',
            fields: ['student_id', 'attendance_date'],
            name: 'unique_student_attendance_per_date'
        });

        // Add index untuk performance
        await queryInterface.addIndex('student_attendances', ['student_id']);
        await queryInterface.addIndex('student_attendances', ['attendance_date']);
        await queryInterface.addIndex('student_attendances', ['status']);
        await queryInterface.addIndex('student_attendances', ['input_method']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('student_attendances');
    }
};
