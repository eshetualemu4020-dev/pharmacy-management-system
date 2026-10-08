const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'pharmacy_db'
  });
  const [rows] = await connection.execute('SELECT * FROM batches ORDER BY id DESC LIMIT 5');
  console.log('Latest Batches:', rows);
  process.exit(0);
}
check().catch(console.error);
