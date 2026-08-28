import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'mysql',
    database: 'pharmacy_db',
    multipleStatements: true
  });
  
  const sql = `
    -- Add columns if they don't exist
    SET @dbname = DATABASE();

    -- purchase_orders
    SET @tablename = 'purchase_orders';
    
    -- po_number
    SET @columnname = 'po_number';
    SET @preparedStatement = (SELECT IF(
      (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
      'SELECT 1',
      CONCAT('ALTER TABLE ', @tablename, ' ADD ', @columnname, ' VARCHAR(50) UNIQUE;')
    ));
    PREPARE alterIfNotExists FROM @preparedStatement;
    EXECUTE alterIfNotExists;
    DEALLOCATE PREPARE alterIfNotExists;

    -- order_date
    SET @columnname = 'order_date';
    SET @preparedStatement = (SELECT IF(
      (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
      'SELECT 1',
      CONCAT('ALTER TABLE ', @tablename, ' ADD ', @columnname, ' DATE;')
    ));
    PREPARE alterIfNotExists FROM @preparedStatement;
    EXECUTE alterIfNotExists;
    DEALLOCATE PREPARE alterIfNotExists;

    -- expected_delivery_date
    SET @columnname = 'expected_delivery_date';
    SET @preparedStatement = (SELECT IF(
      (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
      'SELECT 1',
      CONCAT('ALTER TABLE ', @tablename, ' ADD ', @columnname, ' DATE;')
    ));
    PREPARE alterIfNotExists FROM @preparedStatement;
    EXECUTE alterIfNotExists;
    DEALLOCATE PREPARE alterIfNotExists;

    -- total_amount
    SET @columnname = 'total_amount';
    SET @preparedStatement = (SELECT IF(
      (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
      'SELECT 1',
      CONCAT('ALTER TABLE ', @tablename, ' ADD ', @columnname, ' DECIMAL(10,2) DEFAULT 0.00;')
    ));
    PREPARE alterIfNotExists FROM @preparedStatement;
    EXECUTE alterIfNotExists;
    DEALLOCATE PREPARE alterIfNotExists;

    -- notes
    SET @columnname = 'notes';
    SET @preparedStatement = (SELECT IF(
      (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
      'SELECT 1',
      CONCAT('ALTER TABLE ', @tablename, ' ADD ', @columnname, ' TEXT;')
    ));
    PREPARE alterIfNotExists FROM @preparedStatement;
    EXECUTE alterIfNotExists;
    DEALLOCATE PREPARE alterIfNotExists;

    -- Modify status enum
    ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('draft','pending','approved','ordered','received','cancelled') DEFAULT 'draft';

    -- purchase_order_items
    SET @tablename = 'purchase_order_items';
    
    -- unit_cost
    SET @columnname = 'unit_cost';
    SET @preparedStatement = (SELECT IF(
      (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
      'SELECT 1',
      CONCAT('ALTER TABLE ', @tablename, ' ADD ', @columnname, ' DECIMAL(10,2) DEFAULT 0.00;')
    ));
    PREPARE alterIfNotExists FROM @preparedStatement;
    EXECUTE alterIfNotExists;
    DEALLOCATE PREPARE alterIfNotExists;
  `;
  
  await connection.query(sql);
  console.log("Executed alter PO tables successfully.");
  process.exit(0);
}

run().catch(console.error);
