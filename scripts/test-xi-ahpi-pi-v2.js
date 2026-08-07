const { Class, Grade, Department, Teacher } = require('../src/models');

async function testCreateXIAPHPPI() {
    try {
        console.log('Testing creation of XI APHP PI class...\n');

        // Check if XI APHP PI already exists
        const existing = await Class.findOne({
            where: { name: 'XI APHP PI' }
        });

        if (existing) {
            console.log('⚠️  Class XI APHP PI already exists!');
            console.log('ID:', existing.id);
            console.log('Deleting for test...');
            await existing.destroy();
        }

        console.log('Creating class with:');
        console.log('- grade_id: 2 (Kelas XI)');
        console.log('- department_id: 3 (APHP)');
        console.log('- name: XI APHP PI');

        // Find M. Razmir Hakim
        const teacher = await Teacher.findOne({
            where: { full_name: { [require('sequelize').Op.like]: '%Razmir%' } }
        });

        if (teacher) {
            console.log('- homeroom_teacher_id:', teacher.id, '(' + teacher.full_name + ')');
        } else {
            console.log('- homeroom_teacher_id: null (teacher not found)');
        }

        // Try to create
        try {
            const newClass = await Class.create({
                grade_id: 2,      // Kelas XI
                department_id: 3, // APHP
                name: 'XI APHP PI',
                homeroom_teacher_id: teacher ? teacher.id : null,
                capacity: 30
            });

            console.log('\n✅ SUCCESS! Class XI APHP PI created');
            console.log('New class ID:', newClass.id);

            // Clean up
            await newClass.destroy();
            console.log('Test class cleaned up.');

        } catch (error) {
            console.log('\n❌ FAILED!');
            console.log('Error name:', error.name);
            console.log('Error message:', error.message);

            if (error.name === 'SequelizeUniqueConstraintError') {
                console.log('\n🔍 Unique Constraint Error Details:');
                console.table(error.errors);
            }

            if (error.parent) {
                console.log('\n🔍 Database Error Details:');
                console.log('SQL State:', error.parent.sqlState);
                console.log('SQL Message:', error.parent.sqlMessage);
                console.log('SQL Code:', error.parent.code);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error.message);
        process.exit(1);
    }
}

testCreateXIAPHPPI();
