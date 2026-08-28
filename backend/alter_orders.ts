import pool from './src/config/db.js';

async function alterOrders() {
    try {
        console.log('Altering orders table...');
        
        await pool.query(`
            ALTER TABLE orders 
            MODIFY COLUMN status ENUM('pending','confirmed','processing','ready','out_for_delivery','delivered','completed','cancelled') DEFAULT 'pending',
            ADD COLUMN payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending' AFTER total_amount,
            ADD COLUMN delivery_method ENUM('delivery','pickup') DEFAULT 'delivery' AFTER delivery_address,
            ADD COLUMN notes TEXT AFTER delivery_method,
            ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
        `);
        console.log('orders table altered successfully.');
    } catch (err: any) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('orders table already has the new columns.');
        } else {
            console.error('Error altering orders table:', err);
        }
    }

    try {
        console.log('Altering order_items table...');
        await pool.query(`
            ALTER TABLE order_items 
            ADD COLUMN discount DECIMAL(10,2) DEFAULT 0 AFTER unit_price
        `);
        console.log('order_items table altered successfully.');
    } catch (err: any) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('order_items table already has the discount column.');
        } else {
            console.error('Error altering order_items table:', err);
        }
    }

    try {
        console.log('Creating order_history table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                previous_status VARCHAR(50),
                new_status VARCHAR(50) NOT NULL,
                changed_by INT,
                reason VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (changed_by) REFERENCES users(id)
            )
        `);
        console.log('order_history table created successfully.');
    } catch (err) {
        console.error('Error creating order_history table:', err);
    }

    console.log('Migration completed.');
    process.exit(0);
}

alterOrders();
