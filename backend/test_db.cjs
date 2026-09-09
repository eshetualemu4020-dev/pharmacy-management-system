const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_SERVER || 'localhost',
            port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || '',
            database: process.env.MYSQL_DB || 'pharmacy_db'
        });
        console.log("Connected successfully!");
        await connection.end();
    } catch (e) {
        console.error("Conn Error:", e.message);
    }
}
test();
