CREATE TABLE IF NOT EXISTS stock_adjustments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    drug_id INT NOT NULL,
    batch_id INT NOT NULL,
    adjustment_qty INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    notes TEXT,
    adjusted_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drug_id) REFERENCES drugs(id),
    FOREIGN KEY (batch_id) REFERENCES batches(id),
    FOREIGN KEY (adjusted_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS return_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    return_id INT NOT NULL,
    order_item_id INT NOT NULL,
    quantity_returned INT NOT NULL,
    `condition` ENUM('sellable','damaged') NOT NULL,
    FOREIGN KEY (return_id) REFERENCES returns(id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id)
);

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    sale_id INT,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    status ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
    transaction_ref VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- Ensure orders has a payment_status for quick filtering
ALTER TABLE orders ADD COLUMN payment_status ENUM('pending','completed','failed','refunded') DEFAULT 'pending';
