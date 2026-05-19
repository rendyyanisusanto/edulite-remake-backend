const { sequelize } = require('./src/models');

async function checkDuplicates() {
  try {
    const tables = ['roles', 'permissions', 'menus', 'menu_groups'];
    for (const table of tables) {
      const field = table === 'permissions' ? 'code' : 'name';
      const [results] = await sequelize.query(`SELECT ${field}, COUNT(*) as count FROM ${table} GROUP BY ${field} HAVING count > 1`);
      console.log(`Duplicate ${table}:`, results);
    }
    
    // Check role_permissions for exact duplicates
    const [rpDupes] = await sequelize.query(`SELECT role_id, permission_id, COUNT(*) as count FROM role_permissions GROUP BY role_id, permission_id HAVING count > 1`);
    console.log('Duplicate role_permissions:', rpDupes);

  } catch (error) {
    console.error('Error checking duplicates:', error);
  } finally {
    await sequelize.close();
  }
}

checkDuplicates();
