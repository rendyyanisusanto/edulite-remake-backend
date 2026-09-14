const db = require('../src/models');
const { Op } = require('sequelize');

async function run() {
    try {
        console.log('Memasukkan kembali menu Penugasan Guru dan Akun Peserta ke root group CBT...');

        // Find the CBT Menu Group
        const cbtGroup = await db.MenuGroup.findOne({
            where: { name: 'CBT' }
        });

        if (!cbtGroup) {
            console.error('Menu Group CBT tidak ditemukan.');
            return;
        }

        // 1. Ensure Menu "Penugasan Guru"
        await db.Menu.findOrCreate({
            where: { route: '/cbt/master/teacher-assignments' },
            defaults: {
                group_id: cbtGroup.id,
                parent_id: null, // Sibling of Dashboard and Bank Soal
                name: 'Penugasan Guru',
                icon: 'lucide-users-round',
                permission_code: 'cbt.master.teacher_assignment.view',
                sort_order: 1, // Before Bank Soal
                is_active: true
            }
        });

        // 2. Ensure Menu "Akun Peserta"
        await db.Menu.findOrCreate({
            where: { route: '/cbt/master/student-accounts' },
            defaults: {
                group_id: cbtGroup.id,
                parent_id: null,
                name: 'Akun Peserta',
                icon: 'lucide-user-cog',
                permission_code: 'cbt.master.student_account.view',
                sort_order: 2, // Before Bank Soal
                is_active: true
            }
        });

        console.log('Kedua menu berhasil ditambahkan sebagai root menu.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
