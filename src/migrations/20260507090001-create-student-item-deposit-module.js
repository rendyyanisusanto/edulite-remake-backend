'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('student_item_categories', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            name: { type: Sequelize.STRING(100), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
        });

        await queryInterface.createTable('student_item_deposits', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
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
            class_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'classes', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            category_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'student_item_categories', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            item_name: { type: Sequelize.STRING(150), allowNull: false },
            brand: { type: Sequelize.STRING(100), allowNull: true },
            model: { type: Sequelize.STRING(100), allowNull: true },
            color: { type: Sequelize.STRING(50), allowNull: true },
            serial_number: { type: Sequelize.STRING(100), allowNull: true },
            imei: { type: Sequelize.STRING(100), allowNull: true },
            condition_in: { type: Sequelize.TEXT, allowNull: true },
            accessories: { type: Sequelize.TEXT, allowNull: true },
            storage_location: { type: Sequelize.STRING(150), allowNull: true },
            deposit_date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
            received_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            current_status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'DEPOSITED' },
            photo_in: { type: Sequelize.STRING(255), allowNull: true },
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

        await queryInterface.createTable('student_item_loans', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            deposit_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'student_item_deposits', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            student_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'students', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            loan_date: { type: Sequelize.DATEONLY, allowNull: false },
            borrowed_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
            returned_at: { type: Sequelize.DATE, allowNull: true },
            borrow_method: { type: Sequelize.STRING(30), allowNull: false },
            return_method: { type: Sequelize.STRING(30), allowNull: true },
            borrow_rfid_code: { type: Sequelize.STRING(100), allowNull: true },
            return_rfid_code: { type: Sequelize.STRING(100), allowNull: true },
            borrow_approved_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            return_confirmed_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            borrow_note: { type: Sequelize.TEXT, allowNull: true },
            return_note: { type: Sequelize.TEXT, allowNull: true },
            status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'BORROWED' },
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

        await queryInterface.createTable('student_item_final_returns', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            deposit_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'student_item_deposits', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            return_date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
            returned_to: { type: Sequelize.STRING(150), allowNull: false },
            returned_to_type: { type: Sequelize.STRING(30), allowNull: false },
            returned_to_relation: { type: Sequelize.STRING(100), allowNull: true },
            return_reason: { type: Sequelize.TEXT, allowNull: true },
            condition_out: { type: Sequelize.TEXT, allowNull: true },
            handed_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            photo_out: { type: Sequelize.STRING(255), allowNull: true },
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

        await queryInterface.createTable('student_item_deposit_logs', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            deposit_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'student_item_deposits', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            action: { type: Sequelize.STRING(50), allowNull: false },
            old_status: { type: Sequelize.STRING(30), allowNull: true },
            new_status: { type: Sequelize.STRING(30), allowNull: true },
            source: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'WEB_ADMIN' },
            note: { type: Sequelize.TEXT, allowNull: true },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }
        });

        await queryInterface.createTable('student_item_deposit_settings', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            allow_daily_loan: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            loan_start_time: { type: Sequelize.TIME, allowNull: true },
            loan_end_time: { type: Sequelize.TIME, allowNull: true },
            return_deadline_time: { type: Sequelize.TIME, allowNull: true },
            require_staff_approval_for_borrow: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            require_staff_approval_for_return: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            max_active_loans_per_student: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
            is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }
        });

        await queryInterface.addIndex('student_item_deposits', ['code'], { unique: true, name: 'uidx_student_item_deposits_code' });
        await queryInterface.addIndex('student_item_deposits', ['student_id'], { name: 'idx_student_item_deposits_student_id' });
        await queryInterface.addIndex('student_item_deposits', ['academic_year_id'], { name: 'idx_student_item_deposits_academic_year_id' });
        await queryInterface.addIndex('student_item_deposits', ['class_id'], { name: 'idx_student_item_deposits_class_id' });
        await queryInterface.addIndex('student_item_deposits', ['category_id'], { name: 'idx_student_item_deposits_category_id' });
        await queryInterface.addIndex('student_item_deposits', ['current_status'], { name: 'idx_student_item_deposits_current_status' });
        await queryInterface.addIndex('student_item_deposits', ['deposit_date'], { name: 'idx_student_item_deposits_deposit_date' });

        await queryInterface.addIndex('student_item_loans', ['deposit_id'], { name: 'idx_student_item_loans_deposit_id' });
        await queryInterface.addIndex('student_item_loans', ['student_id'], { name: 'idx_student_item_loans_student_id' });
        await queryInterface.addIndex('student_item_loans', ['loan_date'], { name: 'idx_student_item_loans_loan_date' });
        await queryInterface.addIndex('student_item_loans', ['status'], { name: 'idx_student_item_loans_status' });
        await queryInterface.addIndex('student_item_loans', ['borrowed_at'], { name: 'idx_student_item_loans_borrowed_at' });
        await queryInterface.addIndex('student_item_loans', ['returned_at'], { name: 'idx_student_item_loans_returned_at' });

        await queryInterface.addIndex('student_item_final_returns', ['deposit_id'], { name: 'idx_student_item_final_returns_deposit_id' });
        await queryInterface.addIndex('student_item_final_returns', ['return_date'], { name: 'idx_student_item_final_returns_return_date' });
        await queryInterface.addIndex('student_item_final_returns', ['returned_to_type'], { name: 'idx_student_item_final_returns_returned_to_type' });

        await queryInterface.addIndex('student_item_deposit_logs', ['deposit_id'], { name: 'idx_student_item_deposit_logs_deposit_id' });
        await queryInterface.addIndex('student_item_deposit_logs', ['action'], { name: 'idx_student_item_deposit_logs_action' });
        await queryInterface.addIndex('student_item_deposit_logs', ['created_at'], { name: 'idx_student_item_deposit_logs_created_at' });

        await queryInterface.bulkInsert('student_item_deposit_settings', [{
            allow_daily_loan: true,
            require_staff_approval_for_borrow: false,
            require_staff_approval_for_return: false,
            max_active_loans_per_student: 1,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        }]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('student_item_deposit_settings');
        await queryInterface.dropTable('student_item_deposit_logs');
        await queryInterface.dropTable('student_item_final_returns');
        await queryInterface.dropTable('student_item_loans');
        await queryInterface.dropTable('student_item_deposits');
        await queryInterface.dropTable('student_item_categories');
    }
};
