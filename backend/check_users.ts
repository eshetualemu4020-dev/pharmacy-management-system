import db from './src/config/db.js';

async function checkUsers() {
    try {
        const [rows] = await db.query('SELECT id, email, role FROM users');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await db.end();
    }
}
checkUsers();
