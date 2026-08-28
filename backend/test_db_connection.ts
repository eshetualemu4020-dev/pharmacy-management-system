import pool from './src/config/db.js';

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to the MySQL database!');
        const [rows] = await connection.query<import('mysql2').RowDataPacket[]>('SELECT 1 + 1 AS solution');
        console.log('Test query result:', rows[0].solution);
        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    }
}

testConnection();
