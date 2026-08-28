import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'mysql',
    database: 'pharmacy_db',
    multipleStatements: true
  });
  
  const safeSql = `
    ALTER TABLE suppliers
      ADD COLUMN contact_person VARCHAR(150),
      ADD COLUMN phone VARCHAR(30) NOT NULL DEFAULT '',
      ADD COLUMN email VARCHAR(150),
      ADD COLUMN city VARCHAR(100),
      ADD COLUMN country VARCHAR(100),
      ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active',
      ADD COLUMN notes TEXT,
      ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      DROP COLUMN contact_info;
  `;
  
  try {
    await connection.query(safeSql);
    console.log("Successfully altered suppliers table.");
  } catch (err) {
    console.error("Error altering table, it might already have the columns. Error:", err.message);
  }
  
  process.exit(0);
}

run().catch(console.error);
