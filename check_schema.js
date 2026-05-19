const { sequelize } = require('./src/models');

async function checkSchema() {
    try {
        const [results1] = await sequelize.query("DESCRIBE student_violations;");
        console.log("student_violations schema:");
        console.table(results1);

        const [results2] = await sequelize.query("DESCRIBE student_positive_points;");
        console.log("student_positive_points schema:");
        console.table(results2);
        
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
}

checkSchema();
