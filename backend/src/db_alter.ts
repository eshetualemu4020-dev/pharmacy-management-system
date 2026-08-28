import pool from './config/db.js';

async function alterAuditLogs() {
  try {
    console.log('Adding module column...');
    await pool.query('ALTER TABLE audit_logs ADD COLUMN module VARCHAR(50);').catch(e => console.log(e.message));
    
    console.log('Adding old_value column...');
    await pool.query('ALTER TABLE audit_logs ADD COLUMN old_value TEXT;').catch(e => console.log(e.message));
    
    console.log('Adding new_value column...');
    await pool.query('ALTER TABLE audit_logs ADD COLUMN new_value TEXT;').catch(e => console.log(e.message));
    
    console.log('Database altered successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error altering database:', error);
    process.exit(1);
  }
}

alterAuditLogs();
