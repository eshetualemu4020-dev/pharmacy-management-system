import pool from './src/config/db.js';

async function alterAuditLogs() {
    try {
        console.log('Altering audit_logs table...');
        
        await pool.query(`
            ALTER TABLE audit_logs 
            ADD COLUMN module VARCHAR(100) AFTER action,
            ADD COLUMN description TEXT AFTER target_id,
            ADD COLUMN old_value JSON AFTER description,
            ADD COLUMN new_value JSON AFTER old_value
        `);
        console.log('audit_logs table altered successfully.');
    } catch (err: any) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('audit_logs table already has the new columns.');
        } else {
            console.error('Error altering audit_logs table:', err);
        }
    }

    console.log('Migration completed.');
    process.exit(0);
}

alterAuditLogs();
