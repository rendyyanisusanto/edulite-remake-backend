const { Class, Grade, Department, Teacher } = require('../src/models');

async function testCreateClass() {
    try {
        console.log('Testing class creation with existing homeroom_teacher_id...\n');

        // Get existing data
        const existingClass = await Class.findOne({
            include: [
                { model: Grade, as: 'grade' },
                { model: Department, as: 'department' },
                { model: Teacher, as: 'homeroom_teacher' }
            ]
        });

        if (!existingClass) {
            console.log('No existing class found. Creating test data first...');
            return;
        }

        console.log('Existing class found:');
        console.log({
            id: existingClass.id,
            name: existingClass.name,
            grade: existingClass.grade?.name,
            department: existingClass.department?.name,
            homeroom_teacher: existingClass.homeroom_teacher?.full_name,
            homeroom_teacher_id: existingClass.homeroom_teacher_id
        });

        console.log('\n--- Attempting to create new class with SAME homeroom_teacher_id ---\n');

        // Try to create new class with same homeroom_teacher_id
        try {
            const newClass = await Class.create({
                grade_id: existingClass.grade_id,
                department_id: existingClass.department_id,
                name: 'TEST-' + Date.now(),
                homeroom_teacher_id: existingClass.homeroom_teacher_id,
                capacity: 30
            });

            console.log('✅ SUCCESS! Class created with duplicate homeroom_teacher_id');
            console.log('New class ID:', newClass.id);

            // Clean up
            await newClass.destroy();
            console.log('Test class cleaned up successfully.');

        } catch (error) {
            console.log('❌ FAILED! Error:', error.message);
            if (error.name === 'SequelizeUniqueConstraintError') {
                console.log('Error details:', error.errors);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error.message);
        process.exit(1);
    }
}

testCreateClass();
