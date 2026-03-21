'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user_attendances', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            attendance_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            shift_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'attendance_shifts', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            // ── Clock In ─────────────────────────────────────────────────────
            clock_in_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            clock_in_lat: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: true
            },
            clock_in_lng: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: true
            },
            clock_in_accuracy: {
                type: Sequelize.DECIMAL(8, 2),
                allowNull: true
            },
            clock_in_distance_meters: {
                type: Sequelize.DECIMAL(8, 2),
                allowNull: true
            },
            clock_in_location_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'attendance_locations', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            clock_in_status: {
                type: Sequelize.STRING(30),
                allowNull: true,
                comment: 'ON_TIME, LATE, MANUAL_APPROVED, etc.'
            },
            clock_in_method: {
                type: Sequelize.STRING(30),
                allowNull: true,
                comment: 'GPS, MANUAL, etc.'
            },
            clock_in_selfie_url: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            clock_in_note: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            // ── Clock Out ────────────────────────────────────────────────────
            clock_out_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            clock_out_lat: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: true
            },
            clock_out_lng: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: true
            },
            clock_out_accuracy: {
                type: Sequelize.DECIMAL(8, 2),
                allowNull: true
            },
            clock_out_distance_meters: {
                type: Sequelize.DECIMAL(8, 2),
                allowNull: true
            },
            clock_out_location_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'attendance_locations', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            clock_out_status: {
                type: Sequelize.STRING(30),
                allowNull: true
            },
            clock_out_method: {
                type: Sequelize.STRING(30),
                allowNull: true
            },
            clock_out_selfie_url: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            clock_out_note: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            // ── Summary ──────────────────────────────────────────────────────
            work_duration_minutes: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            attendance_status: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: 'PRESENT',
                comment: 'PRESENT, LATE, ABSENT, INCOMPLETE, HOLIDAY, LEAVE'
            },
            note: {
                type: Sequelize.TEXT,
                allowNull: true
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

        // Unique constraint: one record per user per day
        await queryInterface.addIndex('user_attendances', ['user_id', 'attendance_date'], {
            unique: true,
            name: 'idx_user_attendance_unique'
        });
        await queryInterface.addIndex('user_attendances', ['attendance_date'], { name: 'idx_attendance_date' });
        await queryInterface.addIndex('user_attendances', ['attendance_status'], { name: 'idx_attendance_status' });
        await queryInterface.addIndex('user_attendances', ['user_id'], { name: 'idx_attendance_user' });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('user_attendances');
    }
};
