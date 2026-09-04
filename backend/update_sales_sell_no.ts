import pool from './src/config/db.js';

async function updateSellNo() {
    try {
        await pool.query("UPDATE sales SET sell_no = CONCAT('SALE-', id) WHERE sell_no IS NULL");
        console.log('Successfully updated sell_no for old sales.');
    } catch (e: any) {
        console.error('Error updating:', e);
    } finally {
        process.exit(0);
    }
}
updateSellNo();
