const { Class, Grade, Department, Teacher } = require('../src/models');

async function testUserScenario() {
    try {
        console.log('=== TESTING USER SCENARIO ===\n');
        console.log('Scenario: Creating "XI APHP PI" with homeroom "M. Razmir Hakim"\n');

        // Get the exact data
        const gradeXI = await Grade.findOne({ where: { name: 'Kelas XI' } });
        const deptAPHP = await Department.findOne({ where: { name: { [require('sequelize').Op.like]: '%APHP%' } } });
        const teacherRazmir = await Teacher.findOne({
            where: { full_name: { [require('sequelize').Op.like]: '%Razmir%' } }
        });

        console.log('Data yang akan dikirim:');
        console.log('grade_id:', gradeXI.id, '(', gradeXI.name, ')');
        console.log('department_id:', deptAPHP.id, '(', deptAPHP.name, ')');
        console.log('name:', 'XI APHP PI');
        console.log('homeroom_teacher_id:', teacherRazmir.id, '(', teacherRazmir.full_name, ')');

        // Prepare payload exactly as the frontend would send
        const payload = {
            grade_id: gradeXI.id,
            department_id: deptAPHP.id,
            name: 'XI APHP PI',
            homeroom_teacher_id: teacherRazmir.id,
            capacity: 30
        };

        console.log('\n📤 PAYLOAD:', JSON.stringify(payload, null, 2));

        // Check if class already exists
        const existing = await Class.findOne({ where: { name: 'XI APHP PI' } });
        if (existing) {
            console.log('\n⚠️  Class "XI APHP PI" already exists. Deleting for test...');
            await existing.destroy();
        }

        console.log('\n🔍 Attempting to create class...\n');

        try {
            const newClass = await Class.create(payload);
            console.log('✅ SUCCESS! Class created:');
            console.log('ID:', newClass.id);
            console.log('Name:', newClass.name);
            console.log('Grade ID:', newClass.grade_id);
            console.log('Department ID:', newClass.department_id);
            console.log('Homeroom Teacher ID:', newClass.homeroom_teacher_id);

            // Verify it was created correctly
            const verify = await Class.findByPk(newClass.id, {
                include: [
                    { model: Grade, as: 'grade' },
                    { model: Department, as: 'department' },
                    { model: Teacher, as: 'homeroom_teacher' }
                ]
            });

            console.log('\n📋 VERIFICATION:');
            console.log('Class:', verify.name);
            console.log('Grade:', verify.grade?.name);
            console.log('Department:', verify.department?.name);
            console.log('Homeroom Teacher:', verify.homeroom_teacher?.full_name);

            // Clean up
            console.log('\n🧹 Cleaning up test data...');
            await newClass.destroy();
            console.log('✅ Test completed successfully!');

        } catch (error) {
            console.log('\n❌ CREATION FAILED!');
            console.log('Error Name:', error.name);
            console.log('Error Message:', error.message);

            if (error.name === 'SequelizeUniqueConstraintError') {
                console.log('\n🔍 UNIQUE CONSTRAINT DETAILS:');
                console.table(error.errors);
            }

            if (error.parent) {
                console.log('\n🔍 PARENT ERROR DETAILS:');
                console.log('SQL Code:', error.parent.code);
                console.log('SQL State:', error.parent.sqlState);
                console.log('SQL Message:', error.parent.sqlMessage);
                console.log('SQL:', error.parent.sql);
            }
        }

        console.log('\n=== END TEST ===');
        process.exit(0);
    } catch (error) {
        console.error('❌ Test error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testUserScenario();
