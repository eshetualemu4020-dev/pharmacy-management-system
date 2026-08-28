import pool from './src/config/db.js';

async function alterSalesSchema() {
    try {
        console.log('Adding sell_no column to sales table...');
        
        await pool.query(`
            ALTER TABLE sales
            ADD COLUMN sell_no VARCHAR(50) UNIQUE AFTER id;
        `);
        
        console.log('Successfully added sell_no to sales table.');
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('sell_no column already exists in sales table.');
        } else {
            console.error('Error altering schema:', e);
        }
    } finally {
        process.exit();
    }
}

alterSalesSchema();
