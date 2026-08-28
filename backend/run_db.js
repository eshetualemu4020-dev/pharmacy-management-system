import fs from 'fs';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'mysql',
    database: 'pharmacy_db',
    multipleStatements: true
  });
  
  const sql = fs.readFileSync('db_setup.sql', 'utf8');
  await connection.query(sql);
  console.log("Executed db_setup.sql successfully.");
  process.exit(0);
}

run().catch(console.error);
