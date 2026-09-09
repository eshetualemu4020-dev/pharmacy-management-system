-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    drug_id INT NOT NULL,
    batch_id INT NULL,
    change_qty INT NOT NULL,
    reason ENUM('sale', 'return', 'purchase_receive', 'adjustment', 'dispense') NOT NULL,
    reference_table VARCHAR(50) NULL,
    reference_id INT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drug_id) REFERENCES drugs(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Ensure settings table exists, or if it doesn't, this won't crash
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default reorder threshold setting
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('default_reorder_threshold', '10');
