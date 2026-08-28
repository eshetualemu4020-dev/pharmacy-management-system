-- staff & admin accounts
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('admin','pharmacist','inventory_staff') NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- customer accounts
CREATE TABLE IF NOT EXISTS customers (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    phone           VARCHAR(30),
    password_hash   VARCHAR(255) NOT NULL,
    address         VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     VARCHAR(255)
);

-- one row per batch
CREATE TABLE IF NOT EXISTS drugs (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    name                    VARCHAR(150) NOT NULL,
    generic_name            VARCHAR(150),
    composition             VARCHAR(255),
    batch_id                VARCHAR(50) NOT NULL UNIQUE,
    category_id             INT,
    qty                     INT NOT NULL DEFAULT 0,
    price                   DECIMAL(10,2) NOT NULL,
    mfg_date                DATE NOT NULL,
    exp_date                DATE NOT NULL,
    requires_prescription   BOOLEAN DEFAULT FALSE,
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_name (name),
    INDEX idx_exp (exp_date)
);

-- in-store sales (staff-recorded)
CREATE TABLE IF NOT EXISTS sales (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    sell_no         VARCHAR(50) NOT NULL UNIQUE,
    drug_id         INT NOT NULL,
    sold_qty        INT NOT NULL,
    unit_price      DECIMAL(10,2) NOT NULL,
    sold_date       DATE NOT NULL,
    sold_by         INT NOT NULL,
    FOREIGN KEY (drug_id) REFERENCES drugs(id),
    FOREIGN KEY (sold_by) REFERENCES users(id)
);

-- online orders (customer-placed)
CREATE TABLE IF NOT EXISTS orders (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    customer_id         INT NOT NULL,
    status              ENUM('placed','pending_prescription','confirmed','packed',
                              'shipped','delivered','cancelled') DEFAULT 'placed',
    total_amount        DECIMAL(10,2) NOT NULL,
    delivery_address    VARCHAR(255),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    drug_id         INT NOT NULL,
    quantity        INT NOT NULL,
    unit_price      DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (drug_id) REFERENCES drugs(id)
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    file_url        VARCHAR(255) NOT NULL,
    status          ENUM('pending','approved','rejected') DEFAULT 'pending',
    reviewed_by     INT,
    review_notes    VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    action          VARCHAR(50) NOT NULL,
    target_table    VARCHAR(50),
    target_id       INT,
    details         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- suppliers & restocking (§3.11)
CREATE TABLE IF NOT EXISTS suppliers (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    contact_person  VARCHAR(150),
    phone           VARCHAR(30) NOT NULL DEFAULT '',
    email           VARCHAR(150),
    address         VARCHAR(255),
    city            VARCHAR(100),
    country         VARCHAR(100),
    status          ENUM('active', 'inactive') DEFAULT 'active',
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id     INT NOT NULL,
    created_by      INT NOT NULL,
    status          ENUM('draft','sent','partially_received','received','closed') DEFAULT 'draft',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id   INT NOT NULL,
    drug_id             INT,             -- nullable: may be a new drug not yet in `drugs`
    drug_name           VARCHAR(150) NOT NULL,
    quantity_ordered    INT NOT NULL,
    quantity_received   INT DEFAULT 0,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (drug_id) REFERENCES drugs(id)
);

-- returns & refunds (§3.12)
CREATE TABLE IF NOT EXISTS returns (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    reason          VARCHAR(255),
    status          ENUM('requested','approved','rejected','refunded') DEFAULT 'requested',
    reviewed_by     INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- promotions & coupons (§3.13)
CREATE TABLE IF NOT EXISTS promotions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    discount_type   ENUM('percentage','fixed') NOT NULL,
    discount_value  DECIMAL(10,2) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          ENUM('draft','scheduled','active','expired','inactive') DEFAULT 'draft',
    created_by      INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS promotion_drugs (
    promotion_id INT NOT NULL,
    drug_id INT NOT NULL,
    PRIMARY KEY(promotion_id, drug_id),
    FOREIGN KEY(promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
    FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promotion_categories (
    promotion_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY(promotion_id, category_id),
    FOREIGN KEY(promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- wishlist (§3.14)
CREATE TABLE IF NOT EXISTS wishlist_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NOT NULL,
    drug_id         INT NOT NULL,
    added_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (drug_id) REFERENCES drugs(id),
    UNIQUE (customer_id, drug_id)
);

-- system settings
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Insert default settings
INSERT IGNORE INTO settings (setting_key, setting_value, setting_type) VALUES
('pharmacy_name', 'My Pharmacy', 'string'),
('phone_number', '+1234567890', 'string'),
('email_address', 'contact@pharmacy.com', 'string'),
('address', '123 Health Ave', 'string'),
('city', 'Metropolis', 'string'),
('country', 'Country', 'string'),
('currency', 'USD', 'string'),
('date_format', 'YYYY-MM-DD', 'string'),
('time_format', '24h', 'string'),
('timezone', 'UTC', 'string'),
('min_order_amount', '0', 'number'),
('low_stock_threshold', '10', 'number'),
('expiry_warning_days', '30', 'number'),
('payment_methods', '["Cash", "Card"]', 'json'),
('notify_low_stock', 'true', 'boolean'),
('notify_expiry', 'true', 'boolean'),
('notify_new_order', 'true', 'boolean'),
('notify_prescription', 'true', 'boolean'),
('session_timeout', '60', 'number');
