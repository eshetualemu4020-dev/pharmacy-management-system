const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'pharmacy_db'
  });
  const [drugs] = await connection.execute('DESCRIBE drugs');
  console.log('drugs table schema:');
  console.table(drugs);
  
  const [orderItems] = await connection.execute('DESCRIBE order_items');
  console.log('order_items table schema:');
  console.table(orderItems);
  
  process.exit(0);
}
check().catch(console.error);
