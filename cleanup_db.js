const { sequelize } = require('./src/models');

async function cleanup() {
  const transaction = await sequelize.transaction();
  try {
    const tables = [
      { name: 'menu_groups', field: 'name' },
      { name: 'roles', field: 'name' },
      { name: 'permissions', field: 'code' },
      { name: 'menus', field: 'route' }
    ];

    for (const table of tables) {
      console.log(`Cleaning up ${table.name}...`);
      
      // Get all duplicates
      const [duplicates] = await sequelize.query(
        `SELECT ${table.field}, MIN(id) as keep_id, COUNT(*) as count 
         FROM ${table.name} 
         GROUP BY ${table.field} 
         HAVING count > 1`,
        { transaction }
      );

      for (const dupe of duplicates) {
        console.log(`  Found ${dupe.count} entries for ${dupe[table.field]}. Keeping ID ${dupe.keep_id}`);
        
        // Delete all except keep_id
        await sequelize.query(
          `DELETE FROM ${table.name} WHERE ${table.field} = ? AND id != ?`,
          { 
            replacements: [dupe[table.field], dupe.keep_id],
            transaction 
          }
        );
      }
    }

    // Special case for role_permissions (often doesn't have an 'id' but might have duplicates)
    console.log('Cleaning up role_permissions...');
    // MySQL specific way to remove duplicates from a table without a primary key if necessary, 
    // but here we just want to ensure we don't have exact same (role_id, permission_id) pairs multiple times.
    // If it has an 'id' field, we can use the same logic.
    const [rpHasId] = await sequelize.query("SHOW COLUMNS FROM role_permissions LIKE 'id'", { transaction });
    if (rpHasId.length > 0) {
        await sequelize.query(`
            DELETE t1 FROM role_permissions t1
            INNER JOIN role_permissions t2 
            WHERE t1.id > t2.id 
            AND t1.role_id = t2.role_id 
            AND t1.permission_id = t2.permission_id
        `, { transaction });
    }

    await transaction.commit();
    console.log('Cleanup completed successfully.');
  } catch (error) {
    await transaction.rollback();
    console.error('Cleanup failed:', error);
  } finally {
    await sequelize.close();
  }
}

cleanup();
