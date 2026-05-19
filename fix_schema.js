const { sequelize } = require('./src/models');

async function fixSchema() {
    try {
        console.log("Checking current nullable status...");
        const [res1] = await sequelize.query("SELECT IS_NULLABLE FROM information_schema.columns WHERE table_name = 'student_violations' AND column_name = 'type_id';");
        console.log("student_violations before:", res1);

        console.log("Applying ALTER TABLE...");
        await sequelize.query("ALTER TABLE `student_violations` MODIFY `type_id` INTEGER NULL;");
        await sequelize.query("ALTER TABLE `student_positive_points` MODIFY `type_id` INTEGER NULL;");
        
        const [res2] = await sequelize.query("SELECT IS_NULLABLE FROM information_schema.columns WHERE table_name = 'student_violations' AND column_name = 'type_id';");
        console.log("student_violations after:", res2);
        console.log("Fix applied!");
        
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
}

fixSchema();
