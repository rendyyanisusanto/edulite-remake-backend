'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            await queryInterface.addColumn('students', 'rfid_is_active', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                after: 'rfid_code'
            });
        } catch (error) {
            if (!error.message.includes('Duplicate column name')) throw error;
        }

        try {
            await queryInterface.addColumn('students', 'rfid_assigned_at', {
                type: Sequelize.DATE,
                allowNull: true,
                after: 'rfid_is_active'
            });
        } catch (error) {
            if (!error.message.includes('Duplicate column name')) throw error;
        }

        try {
            await queryInterface.addIndex('students', ['rfid_code'], {
                unique: true,
                name: 'uniq_students_rfid_code'
            });
        } catch (error) {}

        await queryInterface.createTable('student_attendance_shifts', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            code: {
                type: Sequelize.STRING(50),
                allowNull: true,
                unique: true
            },
            academic_year_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'academic_years', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            clock_in_start: {
                type: Sequelize.TIME,
                allowNull: false
            },
            late_after: {
                type: Sequelize.TIME,
                allowNull: false
            },
            clock_in_end: {
                type: Sequelize.TIME,
                allowNull: false
            },
            clock_out_start: {
                type: Sequelize.TIME,
                allowNull: true
            },
            clock_out_end: {
                type: Sequelize.TIME,
                allowNull: true
            },
            allow_checkout: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
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

        await queryInterface.addIndex('student_attendance_shifts', ['academic_year_id'], { name: 'idx_student_attendance_shifts_academic_year' });
        await queryInterface.addIndex('student_attendance_shifts', ['is_active'], { name: 'idx_student_attendance_shifts_is_active' });

        await queryInterface.createTable('student_attendance_shift_classes', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            academic_year_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'academic_years', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            class_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'classes', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            shift_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'student_attendance_shifts', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        await queryInterface.addIndex('student_attendance_shift_classes', ['academic_year_id', 'class_id'], {
            unique: true,
            name: 'uniq_student_attendance_shift_classes_academic_class'
        });
        await queryInterface.addIndex('student_attendance_shift_classes', ['shift_id'], { name: 'idx_student_attendance_shift_classes_shift' });

        await queryInterface.createTable('student_attendance_shift_students', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            academic_year_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'academic_years', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            student_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'students', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            shift_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'student_attendance_shifts', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            start_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            end_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        await queryInterface.addIndex('student_attendance_shift_students', ['academic_year_id', 'student_id'], {
            unique: true,
            name: 'uniq_student_attendance_shift_students_academic_student'
        });
        await queryInterface.addIndex('student_attendance_shift_students', ['shift_id'], { name: 'idx_student_attendance_shift_students_shift' });
        await queryInterface.addIndex('student_attendance_shift_students', ['start_date', 'end_date'], { name: 'idx_student_attendance_shift_students_period' });

        await queryInterface.createTable('student_daily_attendances', {
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
                onDelete: 'CASCADE'
            },
            academic_year_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'academic_years', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            class_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'classes', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            shift_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'student_attendance_shifts', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            attendance_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            clock_in_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            clock_out_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            clock_in_method: {
                type: Sequelize.STRING(30),
                allowNull: true
            },
            clock_out_method: {
                type: Sequelize.STRING(30),
                allowNull: true
            },
            entry_status: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            exit_status: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            attendance_status: {
                type: Sequelize.STRING(20),
                allowNull: false,
                defaultValue: 'INCOMPLETE'
            },
            late_minutes: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
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

        await queryInterface.addIndex('student_daily_attendances', ['student_id', 'attendance_date'], {
            unique: true,
            name: 'uniq_student_daily_attendances_student_date'
        });
        await queryInterface.addIndex('student_daily_attendances', ['attendance_date'], { name: 'idx_student_daily_attendances_date' });
        await queryInterface.addIndex('student_daily_attendances', ['class_id', 'attendance_status'], { name: 'idx_student_daily_attendances_class_status' });

        await queryInterface.createTable('student_attendance_scan_logs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.BIGINT
            },
            student_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'students', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            attendance_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'student_daily_attendances', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            shift_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'student_attendance_shifts', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            scanned_rfid_code: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            scanned_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            scan_type: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            result_status: {
                type: Sequelize.STRING(30),
                allowNull: false
            },
            result_message: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        await queryInterface.addIndex('student_attendance_scan_logs', ['scanned_at'], { name: 'idx_student_attendance_scan_logs_scanned_at' });
        await queryInterface.addIndex('student_attendance_scan_logs', ['student_id', 'scanned_at'], { name: 'idx_student_attendance_scan_logs_student_scanned_at' });
        await queryInterface.addIndex('student_attendance_scan_logs', ['result_status'], { name: 'idx_student_attendance_scan_logs_result_status' });

        await queryInterface.createTable('student_attendance_corrections', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            student_attendance_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'student_daily_attendances', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            student_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'students', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            request_type: {
                type: Sequelize.STRING(30),
                allowNull: false
            },
            requested_clock_in_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            requested_clock_out_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            reason: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            attachment_file: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            status: {
                type: Sequelize.STRING(20),
                allowNull: false,
                defaultValue: 'PENDING'
            },
            reviewed_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            reviewed_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            review_note: {
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

        await queryInterface.addIndex('student_attendance_corrections', ['student_id', 'status'], { name: 'idx_student_attendance_corrections_student_status' });
        await queryInterface.addIndex('student_attendance_corrections', ['student_attendance_id'], { name: 'idx_student_attendance_corrections_attendance_id' });

        await queryInterface.createTable('student_toilet_permissions', {
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
                onDelete: 'CASCADE'
            },
            academic_year_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'academic_years', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            class_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'classes', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            permission_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            exit_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            return_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            duration_minutes: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            status: {
                type: Sequelize.STRING(20),
                allowNull: false,
                defaultValue: 'OUT'
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

        await queryInterface.addIndex('student_toilet_permissions', ['student_id', 'permission_date'], { name: 'idx_student_toilet_permissions_student_date' });
        await queryInterface.addIndex('student_toilet_permissions', ['permission_date', 'status'], { name: 'idx_student_toilet_permissions_date_status' });
        await queryInterface.addIndex('student_toilet_permissions', ['class_id'], { name: 'idx_student_toilet_permissions_class' });

        await queryInterface.createTable('student_toilet_scan_logs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.BIGINT
            },
            student_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'students', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            toilet_permission_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'student_toilet_permissions', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            scanned_rfid_code: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            scanned_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            scan_type: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            result_status: {
                type: Sequelize.STRING(30),
                allowNull: false
            },
            result_message: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        await queryInterface.addIndex('student_toilet_scan_logs', ['scanned_at'], { name: 'idx_student_toilet_scan_logs_scanned_at' });
        await queryInterface.addIndex('student_toilet_scan_logs', ['student_id', 'scanned_at'], { name: 'idx_student_toilet_scan_logs_student_scanned_at' });
        await queryInterface.addIndex('student_toilet_scan_logs', ['result_status'], { name: 'idx_student_toilet_scan_logs_result_status' });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('student_toilet_scan_logs');
        await queryInterface.dropTable('student_toilet_permissions');
        await queryInterface.dropTable('student_attendance_corrections');
        await queryInterface.dropTable('student_attendance_scan_logs');
        await queryInterface.dropTable('student_daily_attendances');
        await queryInterface.dropTable('student_attendance_shift_students');
        await queryInterface.dropTable('student_attendance_shift_classes');
        await queryInterface.dropTable('student_attendance_shifts');

        try { await queryInterface.removeIndex('students', 'uniq_students_rfid_code'); } catch (error) {}
        try { await queryInterface.removeColumn('students', 'rfid_assigned_at'); } catch (error) {}
        try { await queryInterface.removeColumn('students', 'rfid_is_active'); } catch (error) {}
    }
};

