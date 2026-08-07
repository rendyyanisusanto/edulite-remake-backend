const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkConstraints() {
    try {
        const sequelize = new Sequelize(
            process.env.DB_NAME || 'edulite-remake',
            process.env.DB_USER || 'root',
            process.env.DB_PASSWORD || '',
            {
                host: process.env.DB_HOST || '127.0.0.1',
                dialect: 'mysql',
                logging: false
            }
        );

        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Check indexes on classes table
        const [indexes] = await sequelize.query(`
            SHOW INDEX FROM classes WHERE Key_name != 'PRIMARY';
        `);

        console.log('\nIndexes on classes table:');
        console.table(indexes);

        // Check table structure
        const [columns] = await sequelize.query(`
            DESCRIBE classes;
        `);

        console.log('\nClasses table structure:');
        console.table(columns);

        // Try to find unique constraints
        const [constraints] = await sequelize.query(`
            SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'classes'
            AND CONSTRAINT_TYPE = 'UNIQUE';
        `);

        console.log('\nUnique constraints on classes table:');
        console.table(constraints);

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkConstraints();
