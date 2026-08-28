import pool from './src/config/db.js';

async function alterSalesSchema() {
    try {
        console.log('Dropping existing sales table...');
        await pool.query('DROP TABLE IF EXISTS sale_items;');
        await pool.query('DROP TABLE IF EXISTS sales;');

        console.log('Creating new sales table...');
        await pool.query(`
            CREATE TABLE sales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NULL,
                user_id INT NOT NULL,
                total_items INT DEFAULT 0,
                subtotal DECIMAL(10,2) DEFAULT 0.00,
                discount DECIMAL(10,2) DEFAULT 0.00,
                total_amount DECIMAL(10,2) DEFAULT 0.00,
                payment_method ENUM('cash', 'card', 'other') DEFAULT 'cash',
                payment_status ENUM('pending', 'completed', 'refunded', 'failed') DEFAULT 'completed',
                sale_status ENUM('completed', 'refunded', 'cancelled') DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            ) ENGINE=InnoDB;
        `);

        console.log('Creating sale_items table...');
        await pool.query(`
            CREATE TABLE sale_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sale_id INT NOT NULL,
                drug_id INT NOT NULL,
                batch_id INT NULL,
                quantity INT NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
                FOREIGN KEY (drug_id) REFERENCES drugs(id),
                FOREIGN KEY (batch_id) REFERENCES batches(id)
            ) ENGINE=InnoDB;
        `);

        console.log('Database schema successfully altered for sales module.');
    } catch (e) {
        console.error('Error altering schema:', e);
    } finally {
        process.exit();
    }
}

alterSalesSchema();
