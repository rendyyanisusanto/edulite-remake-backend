'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1) extracurricular_categories
        await queryInterface.createTable('extracurricular_categories', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            name: { type: Sequelize.STRING(100), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
        });

        // 2) extracurriculars
        await queryInterface.createTable('extracurriculars', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            category_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'extracurricular_categories', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            academic_year_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'academic_years', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            code: { type: Sequelize.STRING(30), allowNull: false, unique: true },
            name: { type: Sequelize.STRING(100), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            type: { type: Sequelize.STRING(30), allowNull: false },
            location: { type: Sequelize.STRING(150), allowNull: true },
            max_members: { type: Sequelize.INTEGER, allowNull: true },
            min_members: { type: Sequelize.INTEGER, allowNull: true },
            registration_start_date: { type: Sequelize.DATEONLY, allowNull: true },
            registration_end_date: { type: Sequelize.DATEONLY, allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }
        });

        // 3) extracurricular_coaches
        await queryInterface.createTable('extracurricular_coaches', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                unique: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            teacher_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'teachers', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            coach_type: { type: Sequelize.STRING(30), allowNull: false },
            full_name: { type: Sequelize.STRING(100), allowNull: false },
            gender: { type: Sequelize.STRING(20), allowNull: true },
            phone: { type: Sequelize.STRING(30), allowNull: true },
            email: { type: Sequelize.STRING(100), allowNull: true },
            address: { type: Sequelize.TEXT, allowNull: true },
            expertise: { type: Sequelize.STRING(150), allowNull: true },
            photo: { type: Sequelize.STRING(255), allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }
        });

        // 4) extracurricular_coach_assignments
        await queryInterface.createTable('extracurricular_coach_assignments', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            extracurricular_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'extracurriculars', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            coach_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'extracurricular_coaches', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            role: { type: Sequelize.STRING(30), allowNull: false },
            start_date: { type: Sequelize.DATEONLY, allowNull: true },
            end_date: { type: Sequelize.DATEONLY, allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }
        });

        // 5) extracurricular_schedules
        await queryInterface.createTable('extracurricular_schedules', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            extracurricular_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'extracurriculars', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            title: { type: Sequelize.STRING(150), allowNull: true },
            day_of_week: { type: Sequelize.STRING(20), allowNull: false },
            start_time: { type: Sequelize.TIME, allowNull: false },
            end_time: { type: Sequelize.TIME, allowNull: false },
            location: { type: Sequelize.STRING(150), allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
        });

        // 6) extracurricular_registrations
        await queryInterface.createTable('extracurricular_registrations', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            extracurricular_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'extracurriculars', key: 'id' },
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
            academic_year_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'academic_years', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            registration_date: { type: Sequelize.DATE, allowNull: false },
            status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'PENDING' },
            source: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'MOBILE' },
            notes: { type: Sequelize.TEXT, allowNull: true },
            approved_at: { type: Sequelize.DATE, allowNull: true },
            approved_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }
        });

        // 7) extracurricular_members
        await queryInterface.createTable('extracurricular_members', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            extracurricular_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'extracurriculars', key: 'id' },
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
            academic_year_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'academic_years', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            registration_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'extracurricular_registrations', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            join_date: { type: Sequelize.DATEONLY, allowNull: false },
            exit_date: { type: Sequelize.DATEONLY, allowNull: true },
            member_no: { type: Sequelize.STRING(50), allowNull: true },
            status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'ACTIVE' },
            notes: { type: Sequelize.TEXT, allowNull: true },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }
        });

        // 8) extracurricular_sessions
        await queryInterface.createTable('extracurricular_sessions', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            extracurricular_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'extracurriculars', key: 'id' },
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
            schedule_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'extracurricular_schedules', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            coach_assignment_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'extracurricular_coach_assignments', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            session_title: { type: Sequelize.STRING(150), allowNull: true },
            meeting_no: { type: Sequelize.INTEGER, allowNull: true },
            session_date: { type: Sequelize.DATEONLY, allowNull: false },
            start_time: { type: Sequelize.TIME, allowNull: true },
            end_time: { type: Sequelize.TIME, allowNull: true },
            actual_start_at: { type: Sequelize.DATE, allowNull: true },
            actual_end_at: { type: Sequelize.DATE, allowNull: true },
            location: { type: Sequelize.STRING(150), allowNull: true },
            material: { type: Sequelize.TEXT, allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            coach_attendance_status: { type: Sequelize.STRING(30), allowNull: true },
            coach_checkin_at: { type: Sequelize.DATE, allowNull: true },
            coach_checkout_at: { type: Sequelize.DATE, allowNull: true },
            coach_note: { type: Sequelize.TEXT, allowNull: true },
            status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'DRAFT' },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }
        });

        // 9) extracurricular_student_attendances
        await queryInterface.createTable('extracurricular_student_attendances', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            session_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'extracurricular_sessions', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            extracurricular_member_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'extracurricular_members', key: 'id' },
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
            attendance_status: { type: Sequelize.STRING(30), allowNull: false },
            checkin_at: { type: Sequelize.DATE, allowNull: true },
            note: { type: Sequelize.TEXT, allowNull: true },
            marked_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            marked_at: { type: Sequelize.DATE, allowNull: false }
        });

        // 10) extracurricular_progress_aspects
        await queryInterface.createTable('extracurricular_progress_aspects', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            extracurricular_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'extracurriculars', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            name: { type: Sequelize.STRING(100), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
        });

        // 11) extracurricular_student_progress
        await queryInterface.createTable('extracurricular_student_progress', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            extracurricular_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'extracurriculars', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            extracurricular_member_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'extracurricular_members', key: 'id' },
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
            academic_year_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'academic_years', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            session_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'extracurricular_sessions', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            aspect_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'extracurricular_progress_aspects', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            progress_date: { type: Sequelize.DATEONLY, allowNull: false },
            score: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
            predicate: { type: Sequelize.STRING(30), allowNull: true },
            level: { type: Sequelize.STRING(30), allowNull: true },
            note: { type: Sequelize.TEXT, allowNull: true },
            recommendation: { type: Sequelize.TEXT, allowNull: true },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }
        });

        // Indexes & unique constraints
        await queryInterface.addIndex('extracurricular_categories', ['name'], { unique: true, name: 'uq_extracurricular_categories_name' });

        await queryInterface.addIndex('extracurricular_coach_assignments', ['extracurricular_id', 'coach_id', 'is_active'], {
            unique: true,
            name: 'uq_extracurricular_coach_assignments_active'
        });

        await queryInterface.addIndex('extracurricular_registrations', ['extracurricular_id', 'student_id', 'academic_year_id'], {
            unique: true,
            name: 'uq_extracurricular_registrations_unique'
        });

        await queryInterface.addIndex('extracurricular_members', ['extracurricular_id', 'student_id', 'academic_year_id'], {
            unique: true,
            name: 'uq_extracurricular_members_unique'
        });

        await queryInterface.addIndex('extracurricular_sessions', ['extracurricular_id', 'session_date'], {
            name: 'idx_extracurricular_sessions_extracurricular_date'
        });
        await queryInterface.addIndex('extracurricular_sessions', ['status'], {
            name: 'idx_extracurricular_sessions_status'
        });

        await queryInterface.addIndex('extracurricular_student_attendances', ['session_id', 'student_id'], {
            unique: true,
            name: 'uq_extracurricular_student_attendances_unique'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('extracurricular_student_progress');
        await queryInterface.dropTable('extracurricular_progress_aspects');
        await queryInterface.dropTable('extracurricular_student_attendances');
        await queryInterface.dropTable('extracurricular_sessions');
        await queryInterface.dropTable('extracurricular_members');
        await queryInterface.dropTable('extracurricular_registrations');
        await queryInterface.dropTable('extracurricular_schedules');
        await queryInterface.dropTable('extracurricular_coach_assignments');
        await queryInterface.dropTable('extracurricular_coaches');
        await queryInterface.dropTable('extracurriculars');
        await queryInterface.dropTable('extracurricular_categories');
    }
};
