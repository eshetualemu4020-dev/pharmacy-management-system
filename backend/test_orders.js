import mysql from 'mysql2/promise';
async function run() {
    const conn = await mysql.createConnection({host:'localhost', user:'root', password:'mysql', database:'pharmacy_db'});
    // Check customers
    let [customers] = await conn.query("SELECT * FROM customers");
    let customerId;
    if (customers.length === 0) {
        const [res] = await conn.query("INSERT INTO customers (name, email, password_hash, phone) VALUES ('test', 'test@test.com', 'hash', '1234')");
        customerId = res.insertId;
    } else {
        customerId = customers[0].id;
    }

    // Insert drug with requires_prescription = 1
    const [drugRes] = await conn.query("INSERT INTO drugs (name, price, requires_prescription) VALUES ('Test Drug', 10, 1)");
    const drugId = drugRes.insertId;

    // Create order with pending_prescription
    const [orderRes] = await conn.query("INSERT INTO orders (customer_id, status, total_amount) VALUES (?, 'pending_prescription', 10)", [customerId]);
    const orderId = orderRes.insertId;

    // Create order_item
    await conn.query("INSERT INTO order_items (order_id, drug_id, quantity, unit_price) VALUES (?, ?, 1, 10)", [orderId, drugId]);

    // Test query
    const [eligibleOrders] = await conn.query(`
        SELECT o.id, o.created_at, o.total_amount
        FROM orders o
        WHERE o.customer_id = ? 
        AND o.status IN ('placed', 'pending_prescription')
        AND EXISTS (
            SELECT 1 FROM order_items oi
            JOIN drugs d ON oi.drug_id = d.id
            WHERE oi.order_id = o.id AND d.requires_prescription = TRUE
        )
        AND NOT EXISTS (
            SELECT 1 FROM prescriptions p
            WHERE p.order_id = o.id AND p.status IN ('pending', 'approved', 'under_review')
        )
        ORDER BY o.created_at DESC
    `, [customerId]);

    console.log("Eligible:", eligibleOrders);

    conn.end();
}
run();
