import pool from './src/config/db.js';

async function alterAuditLogsOneByOne() {
    const columns = [
        "ADD COLUMN module VARCHAR(100) AFTER action",
        "ADD COLUMN description TEXT AFTER target_id",
        "ADD COLUMN old_value JSON AFTER description",
        "ADD COLUMN new_value JSON AFTER old_value"
    ];

    for (const col of columns) {
        try {
            await pool.query(`ALTER TABLE audit_logs ${col}`);
            console.log(`Added column: ${col}`);
        } catch (err: any) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log(`Column already exists: ${col}`);
            } else {
                console.error(`Error adding column ${col}:`, err);
            }
        }
    }

    console.log('Migration completed.');
    process.exit(0);
}

alterAuditLogsOneByOne();
