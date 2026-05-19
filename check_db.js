const { sequelize } = require('./src/models');

async function checkDuplicates() {
  try {
    const [results] = await sequelize.query('SELECT name, COUNT(*) as count FROM academic_years GROUP BY name HAVING count > 1');
    console.log('Duplicate academic years:', results);
    
    const [all] = await sequelize.query('SELECT * FROM academic_years');
    console.log('All academic years:', all);
  } catch (error) {
    console.error('Error checking duplicates:', error);
  } finally {
    await sequelize.close();
  }
}

checkDuplicates();
