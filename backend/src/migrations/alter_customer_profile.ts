import pool from '../config/db.js';

async function alterCustomerProfileTables() {
    try {
        console.log('Creating customer_addresses table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customer_addresses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                label VARCHAR(100) NOT NULL,
                region VARCHAR(100),
                city VARCHAR(100),
                sub_city VARCHAR(100),
                street VARCHAR(255),
                details TEXT,
                phone VARCHAR(30),
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                INDEX idx_customer_addresses (customer_id)
            );
        `);
        console.log('Successfully created customer_addresses table.');

        console.log('Creating customer_notification_preferences table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customer_notification_preferences (
                customer_id INT PRIMARY KEY,
                order_updates BOOLEAN DEFAULT TRUE,
                prescription_updates BOOLEAN DEFAULT TRUE,
                promotional_updates BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            );
        `);
        console.log('Successfully created customer_notification_preferences table.');
    } catch (error) {
        console.error('Error creating customer profile tables:', error);
    } finally {
        process.exit();
    }
}

alterCustomerProfileTables();
