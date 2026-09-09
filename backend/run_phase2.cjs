const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.MYSQL_SERVER || 'localhost',
        port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DB || 'pharmacy_db',
        multipleStatements: true
    });

    const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'phase2_setup.sql'), 'utf8');
    
    try {
        console.log('Running phase 2 migration...');
        await conn.query(sql);
        console.log('Migration successful!');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await conn.end();
    }
}
run();
