const db = require('../src/models');
const { Op } = require('sequelize');

async function run() {
    try {
        console.log('Menghapus menu Master CBT...');

        // Find the Master CBT menu
        const masterCbt = await db.Menu.findOne({
            where: { name: 'Master CBT' }
        });

        if (masterCbt) {
            // Delete its child menus first
            await db.Menu.destroy({
                where: { parent_id: masterCbt.id }
            });
            console.log('Child menus Master CBT dihapus.');

            // Delete the Master CBT itself
            await db.Menu.destroy({
                where: { id: masterCbt.id }
            });
            console.log('Menu Master CBT dihapus.');
        } else {
            console.log('Menu Master CBT tidak ditemukan.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
