import db from './src/config/db.js';

async function test() {
    try {
        const [categories]: any = await db.query(`
            SELECT c.id, c.name, COUNT(d.id) AS drugCount
            FROM categories c
            LEFT JOIN drugs d ON c.id = d.category_id
            WHERE 1=1
            GROUP BY c.id
        `);
        console.log(categories);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
test();
