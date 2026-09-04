import db from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const [cols] = await db.query('SHOW COLUMNS FROM drugs');
  console.log(cols);
  process.exit();
}

test();
