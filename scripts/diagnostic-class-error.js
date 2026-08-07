const { Class, Grade, Department, Teacher } = require('../src/models');

async function diagnosticClassError() {
    try {
        console.log('=== DIAGNOSTIC: CLASS CREATION ERROR ===\n');

        // 1. Check all classes
        const allClasses = await Class.findAll({
            include: [
                { model: Grade, as: 'grade', attributes: ['id', 'name', 'level'] },
                { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
                { model: Teacher, as: 'homeroom_teacher', attributes: ['id', 'full_name', 'nip'] }
            ],
            order: [['name', 'ASC']]
        });

        console.log('📋 ALL CLASSES IN DATABASE:');
        console.table(allClasses.map(c => ({
            id: c.id,
            name: c.name,
            grade: c.grade?.name,
            grade_id: c.grade_id,
            department: c.department?.name,
            department_id: c.department_id,
            homeroom_teacher: c.homeroom_teacher?.full_name,
            homeroom_teacher_id: c.homeroom_teacher_id
        })));

        // 2. Find Muhammad Razmir Hakim
        const razmir = await Teacher.findOne({
            where: {
                full_name: { [require('sequelize').Op.like]: '%Razmir%' }
            }
        });

        if (razmir) {
            console.log('\n👨‍🏫 FOUND TEACHER:');
            console.log('ID:', razmir.id);
            console.log('Name:', razmir.full_name);

            // Find all classes with this teacher
            const razmirClasses = allClasses.filter(c => c.homeroom_teacher_id === razmir.id);
            console.log('\n📚 CLASSES WITH THIS TEACHER AS HOMEROOM:');
            if (razmirClasses.length > 0) {
                console.table(razmirClasses.map(c => ({ id: c.id, name: c.name, grade: c.grade?.name, department: c.department?.name })));
            } else {
                console.log('None found');
            }
        } else {
            console.log('\n⚠️  Teacher with "Razmir" in name NOT FOUND');
        }

        // 3. Check for potential duplicate scenarios
        console.log('\n🔍 CHECKING FOR POTENTIAL ISSUES:');

        const gradeXI = await Grade.findOne({ where: { name: 'Kelas XI' } });
        const deptAPHP = await Department.findOne({ where: { name: { [require('sequelize').Op.like]: '%APHP%' } } });

        if (gradeXI && deptAPHP) {
            console.log(`Grade XI ID: ${gradeXI.id}, Department APHP ID: ${deptAPHP.id}`);

            // Check if "XI APHP PI" exists
            const existingXIAPHPPI = await Class.findOne({
                where: { name: 'XI APHP PI' }
            });

            if (existingXIAPHPPI) {
                console.log('\n❌ CLASS "XI APHP PI" ALREADY EXISTS!');
                console.log('ID:', existingXIAPHPPI.id);
                console.log('Details:', {
                    grade_id: existingXIAPHPPI.grade_id,
                    department_id: existingXIAPHPPI.department_id,
                    homeroom_teacher_id: existingXIAPHPPI.homeroom_teacher_id
                });
            } else {
                console.log('\n✅ Class "XI APHP PI" does not exist yet - safe to create');
            }

            // Check all XI APHP classes
            const xiAPHPClasses = allClasses.filter(c =>
                c.grade_id === gradeXI.id && c.department_id === deptAPHP.id
            );

            console.log('\n📊 ALL XI APHP CLASSES:');
            if (xiAPHPClasses.length > 0) {
                console.table(xiAPHPClasses.map(c => ({
                    id: c.id,
                    name: c.name,
                    homeroom: c.homeroom_teacher?.full_name
                })));
            } else {
                console.log('No XI APHP classes found');
            }
        }

        console.log('\n=== END DIAGNOSTIC ===');
        process.exit(0);
    } catch (error) {
        console.error('❌ Diagnostic error:', error.message);
        process.exit(1);
    }
}

diagnosticClassError();
