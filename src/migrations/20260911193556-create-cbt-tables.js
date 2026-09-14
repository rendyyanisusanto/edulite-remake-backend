'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, '../../../../edulite-cbt-tables.sql');
        const sqlString = fs.readFileSync(sqlFilePath, 'utf8');

        // Remove comments
        const splitSql = sqlString.split(/;\\s*$/m);

        // Using simple approach, execute directly or statement by statement
        // It's safer to execute statement by statement, but queryInterface.sequelize.query often allows multiline/multi-statement if supported.
        // However, Sequelize doesn't officially support multiple statements in query() unless multipleStatements is enabled in config.
        // So let's extract all CREATE TABLE queries manually, or simply split by delimiter.

        const queries = splitSql.map(q => q.trim()).filter(q => q.length > 0 && !q.startsWith('/*') && q !== 'SET NAMES utf8mb4');

        for (let query of queries) {
            if (query) {
                try {
                    await queryInterface.sequelize.query(query);
                } catch (e) {
                    console.error("Migration error on query: ", query);
                    throw e;
                }
            }
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Drop all 15 tables in reverse order of creation to respect constraints
        const tables = [
            'cbt_activity_logs',
            'cbt_answer_choices',
            'cbt_answers',
            'cbt_attempts',
            'cbt_exam_participants',
            'cbt_exam_classes',
            'cbt_exam_schedules',
            'cbt_exam_question_options',
            'cbt_exam_questions',
            'cbt_exams',
            'cbt_question_options',
            'cbt_questions',
            'cbt_question_banks',
            'cbt_teacher_assignments',
            'student_user_accounts'
        ];

        for (let table of tables) {
            await queryInterface.dropTable(table);
        }
    }
};
