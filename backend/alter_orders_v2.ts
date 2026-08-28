import pool from './src/config/db.js';

async function alterOrdersV2() {
    try {
        console.log('Altering orders table status ENUM...');
        
        await pool.query(`
            ALTER TABLE orders 
            MODIFY COLUMN status ENUM('placed','pending','pending_prescription','confirmed','processing','preparing','ready','out_for_delivery','delivered','completed','rejected','cancelled') DEFAULT 'pending'
        `);
        console.log('orders table status ENUM altered successfully.');
    } catch (err: any) {
        console.error('Error altering orders table:', err);
    }

    console.log('Migration completed.');
    process.exit(0);
}

alterOrdersV2();
