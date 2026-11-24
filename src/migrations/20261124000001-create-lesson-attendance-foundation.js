'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = async (tableName) => {
      const [rows] = await queryInterface.sequelize.query(
        'SHOW TABLES LIKE :tableName',
        { replacements: { tableName } }
      );
      return rows.length > 0;
    };

    const indexExists = async (tableName, indexName) => {
      const indexes = await queryInterface.showIndex(tableName);
      return indexes.some((idx) => idx.name === indexName);
    };

    // 1. Existing table: teachers -> attendance_pin_hash
    const teachersDesc = await queryInterface.describeTable('teachers');
    if (!teachersDesc.attendance_pin_hash) {
      await queryInterface.addColumn('teachers', 'attendance_pin_hash', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      });
    }

    // 2. Existing table: classes -> attendance_token & attendance_qr_active
    const classesDesc = await queryInterface.describeTable('classes');
    if (!classesDesc.attendance_token) {
      await queryInterface.addColumn('classes', 'attendance_token', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      });
    }
    if (!classesDesc.attendance_qr_active) {
      await queryInterface.addColumn('classes', 'attendance_qr_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
    if (!(await indexExists('classes', 'uq_classes_attendance_token'))) {
      await queryInterface.addIndex('classes', ['attendance_token'], {
        unique: true,
        name: 'uq_classes_attendance_token'
      });
    }

    // 3. New table: lesson_attendance_sessions
    if (!(await tableExists('lesson_attendance_sessions'))) {
      await queryInterface.createTable('lesson_attendance_sessions', {
        id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
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
          allowNull: false,
          references: { model: 'classes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        teacher_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'teachers', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        subject_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'subjects', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        lesson_period_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'lesson_periods', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        attendance_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        period_number: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        period_start_time: {
          type: Sequelize.TIME,
          allowNull: false
        },
        period_end_time: {
          type: Sequelize.TIME,
          allowNull: false
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        input_method: {
          type: Sequelize.ENUM('QR', 'ADMIN'),
          allowNull: false,
          defaultValue: 'QR'
        },
        cancelled_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex(
        'lesson_attendance_sessions',
        ['academic_year_id', 'class_id', 'attendance_date', 'period_number'],
        { unique: true, name: 'uq_la_session_class_date_period' }
      );
      await queryInterface.addIndex('lesson_attendance_sessions', ['attendance_date', 'class_id'], {
        name: 'idx_la_session_date_class'
      });
      await queryInterface.addIndex('lesson_attendance_sessions', ['teacher_id', 'attendance_date'], {
        name: 'idx_la_session_teacher_date'
      });
      await queryInterface.addIndex('lesson_attendance_sessions', ['subject_id', 'attendance_date'], {
        name: 'idx_la_session_subject_date'
      });
      await queryInterface.addIndex('lesson_attendance_sessions', ['class_id'], {
        name: 'idx_la_session_class'
      });
      await queryInterface.addIndex('lesson_attendance_sessions', ['lesson_period_id'], {
        name: 'idx_la_session_period'
      });
    }

    // 4. New table: lesson_attendance_details
    if (!(await tableExists('lesson_attendance_details'))) {
      await queryInterface.createTable('lesson_attendance_details', {
        id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        session_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: { model: 'lesson_attendance_sessions', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        student_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'students', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        status: {
          type: Sequelize.ENUM('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA'),
          allowNull: false
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('lesson_attendance_details', ['session_id', 'student_id'], {
        unique: true,
        name: 'uq_la_detail_session_student'
      });
      await queryInterface.addIndex('lesson_attendance_details', ['student_id', 'status'], {
        name: 'idx_la_detail_student_status'
      });
    }

    // 5. New table: lesson_attendance_logs
    if (!(await tableExists('lesson_attendance_logs'))) {
      await queryInterface.createTable('lesson_attendance_logs', {
        id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        session_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: { model: 'lesson_attendance_sessions', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        teacher_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'teachers', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        action: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        old_data: {
          type: Sequelize.JSON,
          allowNull: true
        },
        new_data: {
          type: Sequelize.JSON,
          allowNull: true
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('lesson_attendance_logs', ['session_id', 'created_at'], {
        name: 'idx_la_log_session_date'
      });
      await queryInterface.addIndex('lesson_attendance_logs', ['teacher_id'], {
        name: 'idx_la_log_teacher'
      });
      await queryInterface.addIndex('lesson_attendance_logs', ['user_id'], {
        name: 'idx_la_log_user'
      });
      await queryInterface.addIndex('lesson_attendance_logs', ['action', 'created_at'], {
        name: 'idx_la_log_action_date'
      });
    }
  },

  async down() {
    // Non-destructive down migration: preserve existing production data and schema.
    // Intentional no-op to prevent accidental loss of lesson attendance transactions or credentials.
  }
};
