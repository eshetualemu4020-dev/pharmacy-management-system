import pool from '../config/db.js';

async function alterSupportTickets() {
    try {
        console.log('Creating support_tickets table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS support_tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                order_id INT NULL,
                issue_type VARCHAR(100) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
                INDEX idx_support_customer (customer_id, created_at DESC)
            );
        `);
        console.log('Successfully created support_tickets table.');

        console.log('Creating support_ticket_responses table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS support_ticket_responses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                sender_type ENUM('customer', 'staff') NOT NULL,
                sender_id INT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
                INDEX idx_support_responses (ticket_id, created_at ASC)
            );
        `);
        console.log('Successfully created support_ticket_responses table.');

    } catch (error) {
        console.error('Error creating support tables:', error);
    } finally {
        process.exit();
    }
}

alterSupportTickets();
