import pool from './src/config/db';

async function run() {
    try {
        await pool.query("ALTER TABLE prescriptions MODIFY COLUMN status ENUM('pending', 'under_review', 'approved', 'rejected') DEFAULT 'pending'");
        console.log('Successfully altered prescriptions status ENUM');
    } catch (e: any) {
        console.error('Error altering table:', e.message);
    } finally {
        pool.end();
    }
}

run();
