const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'pharmacy_db'
  });
  const [rows] = await connection.execute('SELECT id, email, role FROM users');
  console.log('Users:', rows);
  
  const [customers] = await connection.execute('SELECT id, email FROM customers');
  console.log('Customers:', customers);
  
  process.exit(0);
}
check().catch(console.error);
