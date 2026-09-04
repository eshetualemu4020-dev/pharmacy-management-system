import { Request, Response } from 'express';
import pool from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';
import { createNotification } from './notificationController.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2025-02-24.acacia' as any
});

export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        const { search, status, date_range, sort, page = '1', limit = '10' } = req.query;

        let query = `
            SELECT o.*,
                   (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as total_items
            FROM orders o
            WHERE o.customer_id = ?
        `;
        const queryParams: any[] = [customerId];

        if (search) {
            query += ` AND (o.id LIKE ?)`;
            queryParams.push(`%${search}%`);
        }

        if (status && status !== 'All') {
            query += ` AND o.status = ?`;
            queryParams.push(status);
        }

        if (date_range === 'today') {
            query += ` AND DATE(o.created_at) = CURDATE()`;
        } else if (date_range === 'week') {
            query += ` AND YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1)`;
        } else if (date_range === 'month') {
            query += ` AND MONTH(o.created_at) = MONTH(CURDATE()) AND YEAR(o.created_at) = YEAR(CURDATE())`;
        }

        if (sort === 'oldest') {
            query += ` ORDER BY o.created_at ASC`;
        } else if (sort === 'highest') {
            query += ` ORDER BY o.total_amount DESC`;
        } else if (sort === 'lowest') {
            query += ` ORDER BY o.total_amount ASC`;
        } else {
            query += ` ORDER BY o.created_at DESC`;
        }

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit as string), offset);

        const [rows] = await pool.query(query, queryParams);

        // Count for pagination
        let countQuery = `SELECT COUNT(o.id) as total FROM orders o WHERE o.customer_id = ?`;
        const countParams: any[] = [customerId];
        
        if (search) {
            countQuery += ` AND (o.id LIKE ?)`;
            countParams.push(`%${search}%`);
        }
        if (status && status !== 'All') {
            countQuery += ` AND o.status = ?`;
            countParams.push(status);
        }
        if (date_range === 'today') {
            countQuery += ` AND DATE(o.created_at) = CURDATE()`;
        } else if (date_range === 'week') {
            countQuery += ` AND YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1)`;
        } else if (date_range === 'month') {
            countQuery += ` AND MONTH(o.created_at) = MONTH(CURDATE()) AND YEAR(o.created_at) = YEAR(CURDATE())`;
        }

        const [countRows] = await pool.query(countQuery, countParams);
        const total = (countRows as any)[0].total;

        res.json({
            data: rows,
            pagination: {
                total,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                totalPages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error: any) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({ error: 'Unable to load orders' });
    }
};

export const getMyOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        const orderId = req.params.id;

        // Fetch order ensuring it belongs to the authenticated customer
        const [orders] = await pool.query(`
            SELECT o.*,
                   p.id as prescription_id,
                   p.status as prescription_status,
                   p.file_url as prescription_url,
                   p.review_notes as prescription_notes
            FROM orders o
            LEFT JOIN prescriptions p ON p.order_id = o.id
            WHERE o.id = ? AND o.customer_id = ?
        `, [orderId, customerId]);

        if ((orders as any[]).length === 0) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        const order = (orders as any)[0];

        // Fetch order items with historical prices
        const [items] = await pool.query(`
            SELECT oi.*, d.name as drug_name, d.generic_name, d.dosage_form, d.strength, d.requires_prescription
            FROM order_items oi
            JOIN drugs d ON oi.drug_id = d.id
            WHERE oi.order_id = ?
        `, [orderId]);
        order.items = items;

        // Fetch timeline history
        const [history] = await pool.query(`
            SELECT h.* 
            FROM order_history h
            WHERE h.order_id = ?
            ORDER BY h.created_at ASC
        `, [orderId]);
        order.history = history;

        res.json(order);
    } catch (error: any) {
        console.error('Error fetching customer order details:', error);
        res.status(500).json({ error: 'Unable to load order details' });
    }
};

export const cancelMyOrder = async (req: Request, res: Response): Promise<void> => {
    const connection = await pool.getConnection();
    try {
        const customerId = (req as any).user.id;
        const orderId = req.params.id;

        await connection.beginTransaction();

        const [orders] = await connection.query(`
            SELECT status FROM orders WHERE id = ? AND customer_id = ? FOR UPDATE
        `, [orderId, customerId]);

        if ((orders as any[]).length === 0) {
            await connection.rollback();
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        const currentOrder = (orders as any)[0];

        // Ensure order is in a cancellable state
        if (!['placed', 'pending_prescription'].includes(currentOrder.status)) {
            await connection.rollback();
            res.status(400).json({ error: 'Order cannot be cancelled in its current state' });
            return;
        }

        await connection.query(`UPDATE orders SET status = 'cancelled' WHERE id = ?`, [orderId]);

        await connection.query(`
            INSERT INTO order_history (order_id, previous_status, new_status, changed_by, reason) 
            VALUES (?, ?, 'cancelled', NULL, 'Cancelled by Customer')
        `, [orderId, currentOrder.status]);

        await createNotification(connection, customerId, 'ORDER', 'Order Cancelled', `You have successfully cancelled your order ORD-${orderId}.`, parseInt(orderId));

        // Note: Skipping logAudit here because audit_logs table enforces user_id FK to 'users' table, and this is a 'customer' action.
        
        await connection.commit();
        res.json({ message: 'Order cancelled successfully' });
    } catch (error: any) {
        await connection.rollback();
        console.error('Error in customer cancelling order:', error);
        res.status(500).json({ error: 'Unable to cancel order' });
    } finally {
        connection.release();
    }
};
export const checkout = async (req: Request, res: Response): Promise<void> => {
    const connection = await pool.getConnection();
    try {
        const customerId = (req as any).user.id;
        const { payment_method, delivery_method, delivery_address, delivery_instructions, promotion_id } = req.body;

        await connection.beginTransaction();

        // 1. Validate Cart
        const [cartRows] = await connection.query(`SELECT id FROM carts WHERE customer_id = ?`, [customerId]);
        if ((cartRows as any[]).length === 0) {
            await connection.rollback();
            res.status(400).json({ error: 'Cart is empty' });
            return;
        }
        const cartId = (cartRows as any)[0].id;

        const [items] = await connection.query(`
            SELECT ci.id as cart_item_id, ci.quantity, d.id as drug_id, d.name, d.price, d.stock, d.is_active, d.requires_prescription, d.category_id
            FROM cart_items ci
            JOIN drugs d ON ci.drug_id = d.id
            WHERE ci.cart_id = ?
        `, [cartId]);

        if ((items as any[]).length === 0) {
            await connection.rollback();
            res.status(400).json({ error: 'Cart is empty' });
            return;
        }

        let subtotal = 0;
        let requiresPrescription = false;
        const validationErrors: string[] = [];

        for (const item of (items as any[])) {
            if (!item.is_active) {
                validationErrors.push(`${item.name} is no longer available.`);
            } else if (item.quantity > item.stock) {
                validationErrors.push(`Only ${item.stock} units of ${item.name} are currently available.`);
            }
            if (item.requires_prescription) {
                requiresPrescription = true;
            }
            subtotal += (item.quantity * item.price);
        }

        if (validationErrors.length > 0) {
            await connection.rollback();
            res.status(400).json({ error: 'Your cart needs to be updated before checkout.', details: validationErrors });
            return;
        }

        let discount = 0;
        if (promotion_id) {
            const [promoRows] = await connection.query(`SELECT * FROM promotions WHERE id = ? AND status = 'active'`, [promotion_id]);
            if ((promoRows as any[]).length > 0) {
                const promotion = (promoRows as any)[0];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const startDate = new Date(promotion.start_date);
                const endDate = new Date(promotion.end_date);
                
                if (today >= startDate && today <= endDate) {
                    const [promoDrugs] = await connection.query(`SELECT drug_id FROM promotion_drugs WHERE promotion_id = ?`, [promotion_id]);
                    const applicableDrugIds = new Set((promoDrugs as any[]).map(d => d.drug_id));

                    const [promoCats] = await connection.query(`SELECT category_id FROM promotion_categories WHERE promotion_id = ?`, [promotion_id]);
                    const applicableCategoryIds = new Set((promoCats as any[]).map(c => c.category_id));

                    let totalEligibleSubtotal = 0;
                    for (const item of (items as any[])) {
                        const isEligible = applicableDrugIds.has(item.drug_id) || (item.category_id && applicableCategoryIds.has(item.category_id));
                        if (isEligible) {
                            totalEligibleSubtotal += (item.quantity * item.price);
                        }
                    }

                    if (totalEligibleSubtotal > 0) {
                        if (promotion.discount_type === 'percentage') {
                            discount = (totalEligibleSubtotal * parseFloat(promotion.discount_value)) / 100;
                        } else if (promotion.discount_type === 'fixed') {
                            discount = parseFloat(promotion.discount_value);
                            if (discount > totalEligibleSubtotal) discount = totalEligibleSubtotal;
                        }
                    }
                }
            }
        }

        const deliveryFee = delivery_method === 'Delivery' ? 50 : 0; // Hardcoded 50 ETB delivery fee for now
        const totalAmount = subtotal - discount + deliveryFee;

        // 2. Create Order
        const orderStatus = requiresPrescription ? 'pending_prescription' : 'placed';
        
        const [orderResult] = await connection.query(`
            INSERT INTO orders (customer_id, status, total_amount, payment_method, payment_status, delivery_method, delivery_address, delivery_instructions) 
            VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?)
        `, [customerId, orderStatus, totalAmount, payment_method, delivery_method, delivery_address, delivery_instructions]);
        
        const orderId = (orderResult as any).insertId;

        // 3. Create Order Items
        for (const item of (items as any[])) {
            await connection.query(`
                INSERT INTO order_items (order_id, drug_id, quantity, unit_price, discount, total_price) 
                VALUES (?, ?, ?, ?, 0, ?)
            `, [orderId, item.drug_id, item.quantity, item.price, item.quantity * item.price]);
        }

        // 4. Create Initial Order History
        await connection.query(`
            INSERT INTO order_history (order_id, previous_status, new_status, reason) 
            VALUES (?, 'none', ?, 'Order created')
        `, [orderId, orderStatus]);

        // 5. Clear Cart
        await connection.query(`DELETE FROM cart_items WHERE cart_id = ?`, [cartId]);

        // 6. Handle Stripe Payment if Card
        let clientSecret = null;
        if (payment_method === 'Card') {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalAmount * 100), // Stripe expects amounts in cents/smallest currency unit
                currency: 'etb',
                metadata: {
                    orderId: orderId.toString(),
                    customerId: customerId.toString()
                }
            });
            clientSecret = paymentIntent.client_secret;
        }

        await connection.commit();

        res.json({
            message: 'Order created successfully',
            orderId,
            clientSecret,
            requiresPrescription
        });

    } catch (error: any) {
        await connection.rollback();
        console.error('Error in checkout:', error);
        res.status(500).json({ error: 'Unable to process checkout' });
    } finally {
        connection.release();
    }
};

export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
    const connection = await pool.getConnection();
    try {
        const customerId = (req as any).user.id;
        const orderId = req.params.id;
        const { payment_intent_id } = req.body;

        if (!payment_intent_id) {
            res.status(400).json({ error: 'Payment intent ID is required' });
            return;
        }

        // Verify with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

        if (paymentIntent.status === 'succeeded' && paymentIntent.metadata.orderId === orderId.toString()) {
            await connection.beginTransaction();

            // Update order
            await connection.query(`
                UPDATE orders SET payment_status = 'Paid' 
                WHERE id = ? AND customer_id = ?
            `, [orderId, customerId]);

            await connection.query(`
                INSERT INTO order_history (order_id, previous_status, new_status, reason) 
                VALUES (?, 'payment_pending', 'payment_success', 'Payment verified via Stripe')
            `, [orderId]);

            await connection.commit();
            res.json({ message: 'Payment confirmed successfully' });
        } else {
            res.status(400).json({ error: 'Payment not successful or mismatch' });
        }
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error('Error in confirmPayment:', error);
        res.status(500).json({ error: 'Unable to confirm payment' });
    } finally {
        if (connection) connection.release();
    }
};
