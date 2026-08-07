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

        // Find the grade_id for XI and department_id for APHP
        const [xiGrade] = await Grade.findAll({ where: { name: { [require('sequelize').Op.like]: '%XI%' } } });
        const [aphpDept] = await Department.findAll({ where: { name: { [require('sequelize').Op.like]: '%APHP%' } } });

        if (!xiGrade || !aphpDept) {
            console.log('❌ Grade XI or Department APHP not found');
            return;
        }

        console.log('Creating class with:');
        console.log('- grade_id:', xiGrade.id, '(' + xiGrade.name + ')');
        console.log('- department_id:', aphpDept.id, '(' + aphpDept.name + ')');
        console.log('- name: XI APHP PI');
        console.log('- homeroom_teacher_id: (searching for M. Razmir Hakim...)');

        // Find M. Razmir Hakim
        const teacher = await Teacher.findOne({
            where: { full_name: { [require('sequelize').Op.like]: '%Razmir%' } }
        });

        console.log('- homeroom_teacher_id:', teacher ? teacher.id : 'null', teacher ? '(' + teacher.full_name + ')' : '');

        // Try to create
        try {
            const newClass = await Class.create({
                grade_id: xiGrade.id,
                department_id: aphpDept.id,
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
                console.log('\nUnique Constraint Error Details:');
                console.table(error.errors);
            }

            if (error.parent) {
                console.log('\nDatabase Error:');
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
