import pool from '../src/config/db.js';

async function run() {
    try {
        const customerId = 1;
        
        let [cartRows] = await pool.query(`SELECT id FROM carts WHERE customer_id = ?`, [customerId]);
        if ((cartRows as any[]).length === 0) {
            console.log('No cart');
            process.exit(0);
        }
        const cartId = (cartRows as any)[0].id;
        
        const [items] = await pool.query(`
            SELECT ci.id as cart_item_id, ci.quantity, d.id as drug_id, d.name, d.price, d.stock, d.is_active, d.requires_prescription, d.category_id
            FROM cart_items ci
            JOIN drugs d ON ci.drug_id = d.id
            WHERE ci.cart_id = ?
        `, [cartId]);
        
        console.log('Cart items:', items);
        
        let requiresPrescription = false;
        let subtotal = 0;
        for (const item of (items as any[])) {
            if (item.requires_prescription) requiresPrescription = true;
            subtotal += (item.quantity * item.price);
        }
        
        console.log('requiresPrescription:', requiresPrescription);
        console.log('subtotal:', subtotal);
        
        const delivery_method = 'Delivery';
        const delivery_address = 'Test Address';
        const delivery_instructions = '';
        const payment_method = 'Cash';
        const deliveryFee = delivery_method === 'Delivery' ? 50 : 0;
        const totalAmount = subtotal + deliveryFee;
        
        const orderStatus = requiresPrescription ? 'pending_prescription' : 'placed';
        console.log('Creating order with status:', orderStatus, 'amount:', totalAmount);
        
        const [orderResult] = await pool.query(`
            INSERT INTO orders (customer_id, status, total_amount, payment_method, payment_status, delivery_method, delivery_address, delivery_instructions) 
            VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?)
        `, [customerId, orderStatus, totalAmount, payment_method, delivery_method, delivery_address, delivery_instructions]);
        
        const orderId = (orderResult as any).insertId;
        console.log('Order created:', orderId);
        
        for (const item of (items as any[])) {
            await pool.query(`
                INSERT INTO order_items (order_id, drug_id, quantity, unit_price, discount, total_price) 
                VALUES (?, ?, ?, ?, 0, ?)
            `, [orderId, item.drug_id, item.quantity, item.price, item.quantity * item.price]);
        }
        
        await pool.query(`
            INSERT INTO order_history (order_id, previous_status, new_status, reason) 
            VALUES (?, 'none', ?, 'Order created')
        `, [orderId, orderStatus]);
        
        console.log('Order items and history created successfully.');
        
    } catch(e) {
        console.error('Error:', e);
    }
    process.exit(0);
}
run();
