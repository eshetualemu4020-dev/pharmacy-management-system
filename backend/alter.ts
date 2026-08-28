import pool from './src/config/db';

async function run() {
    try {
        await pool.query('ALTER TABLE prescriptions ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        console.log('Successfully altered prescriptions table');
    } catch (e: any) {
        if (e.message.includes('Duplicate column name')) {
            console.log('Column updated_at already exists.');
        } else {
            console.error('Error altering table:', e.message);
        }
    } finally {
        pool.end();
    }
}

run();
