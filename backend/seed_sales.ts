import pool from './src/config/db.js';

async function seedSales() {
    try {
        console.log('Fetching drugs to use for dummy sales...');
        const [drugs] = await pool.query('SELECT * FROM drugs LIMIT 3');
        if ((drugs as any[]).length === 0) {
            console.log('No drugs found. Aborting dummy data creation.');
            return;
        }

        const drug1 = (drugs as any)[0];
        const drug2 = (drugs as any)[1] || drug1;

        console.log('Fetching a user to attribute sales to...');
        const [users] = await pool.query('SELECT * FROM users LIMIT 1');
        if ((users as any[]).length === 0) {
            console.log('No users found. Aborting dummy data creation.');
            return;
        }
        const userId = (users as any)[0].id;

        console.log('Creating dummy sale...');
        const items = [
            {
                drug_id: drug1.id,
                quantity: 2,
                unit_price: drug1.price
            },
            {
                drug_id: drug2.id,
                quantity: 1,
                unit_price: drug2.price
            }
        ];

        let subtotal = (2 * drug1.price) + (1 * drug2.price);
        let discount = 10;
        let total_amount = subtotal - discount;

        const [saleResult] = await pool.query(`
            INSERT INTO sales (customer_id, user_id, total_items, subtotal, discount, total_amount, payment_method, payment_status, sale_status)
            VALUES (NULL, ?, ?, ?, ?, ?, 'cash', 'completed', 'completed')
        `, [userId, 3, subtotal, discount, total_amount]);

        const saleId = (saleResult as any).insertId;

        console.log(`Sale created with ID: ${saleId}`);

        for (const item of items) {
            await pool.query(`
                INSERT INTO sale_items (sale_id, drug_id, quantity, unit_price, subtotal)
                VALUES (?, ?, ?, ?, ?)
            `, [saleId, item.drug_id, item.quantity, item.unit_price, item.quantity * item.unit_price]);
        }
        
        console.log('Dummy sale created successfully.');
    } catch (e) {
        console.error('Error seeding dummy sales:', e);
    } finally {
        process.exit();
    }
}

seedSales();
