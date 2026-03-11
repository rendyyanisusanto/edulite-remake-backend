require('dotenv').config();
const app = require('./app');
const db = require('./models');
const logger = require('./core/logger');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await db.sequelize.authenticate();
        logger.info('Database connection has been established successfully.');

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

startServer();
