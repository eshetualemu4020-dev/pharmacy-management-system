import pool from './src/config/db.js';

async function checkSchema() {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        console.log('Tables:', tables);
        
        for (const row of (tables as any[])) {
            const tableName = Object.values(row)[0];
            const [columns] = await pool.query(`DESCRIBE ${tableName}`);
            console.log(`\nSchema for ${tableName}:`, columns);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
checkSchema();
