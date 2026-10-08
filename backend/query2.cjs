const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'pharmacy_db'
  });
  const [rows] = await connection.execute('SELECT id, name, is_active FROM drugs');
  console.log('Drugs:', rows);
  process.exit(0);
}
check().catch(console.error);
