import pool from '../config/db.js';

async function alterNotificationsTable() {
    try {
        console.log('Creating customer_notifications table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customer_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                type ENUM('ORDER', 'PRESCRIPTION', 'PAYMENT', 'PROMOTION', 'ACCOUNT', 'SYSTEM') NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                related_id INT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                INDEX idx_customer_created (customer_id, created_at DESC)
            );
        `);
        console.log('Successfully created customer_notifications table.');
    } catch (error) {
        console.error('Error creating customer_notifications table:', error);
    } finally {
        process.exit();
    }
}

alterNotificationsTable();
