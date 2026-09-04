import { Request, Response } from 'express';
import pool from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';
import { createNotification } from './notificationController.js';

export const getOrders = async (req: Request, res: Response): Promise<any> => {
    try {
        const { search, status, payment_status, delivery_method, date_range, page = '1', limit = '10' } = req.query;

        let query = `
            SELECT o.*, 
                   c.name as customer_name,
                   c.email as customer_email,
                   c.phone as customer_phone,
                   (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as total_items,
                   p.status as prescription_status
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN prescriptions p ON p.order_id = o.id
            WHERE 1=1
        `;
        const queryParams: any[] = [];

        if (search) {
            query += ` AND (o.id LIKE ? OR c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
            const searchParam = `%${search}%`;
            queryParams.push(searchParam, searchParam, searchParam, searchParam);
        }

        if (status) {
            query += ` AND o.status = ?`;
            queryParams.push(status);
        }

        if (payment_status) {
            query += ` AND o.payment_status = ?`;
            queryParams.push(payment_status);
        }

        if (delivery_method) {
            query += ` AND o.delivery_method = ?`;
            queryParams.push(delivery_method);
        }

        if (date_range === 'today') {
            query += ` AND DATE(o.created_at) = CURDATE()`;
        } else if (date_range === 'week') {
            query += ` AND YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1)`;
        } else if (date_range === 'month') {
            query += ` AND MONTH(o.created_at) = MONTH(CURDATE()) AND YEAR(o.created_at) = YEAR(CURDATE())`;
        }

        query += ` ORDER BY o.created_at DESC`;

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit as string), offset);

        const [rows] = await pool.query(query, queryParams);

        // Count for pagination
        let countQuery = `
            SELECT COUNT(o.id) as total 
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE 1=1
        `;
        const countParams: any[] = [];
        
        if (search) {
            countQuery += ` AND (o.id LIKE ? OR c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
            const searchParam = `%${search}%`;
            countParams.push(searchParam, searchParam, searchParam, searchParam);
        }
        if (status) {
            countQuery += ` AND o.status = ?`;
            countParams.push(status);
        }
        if (payment_status) {
            countQuery += ` AND o.payment_status = ?`;
            countParams.push(payment_status);
        }
        if (delivery_method) {
            countQuery += ` AND o.delivery_method = ?`;
            countParams.push(delivery_method);
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
    } catch (error) {
        console.error('Error in getOrders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getOrderById = async (req: Request, res: Response): Promise<any> => {
    try {
        const orderId = req.params.id;

        const [orders] = await pool.query(`
            SELECT o.*, 
                   c.name as customer_name,
                   c.email as customer_email,
                   c.phone as customer_phone,
                   c.address as customer_address,
                   p.id as prescription_id,
                   p.status as prescription_status,
                   p.file_url as prescription_url,
                   p.review_notes as prescription_notes
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN prescriptions p ON p.order_id = o.id
            WHERE o.id = ?
        `, [orderId]);

        if ((orders as any[]).length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const order = (orders as any)[0];

        const [items] = await pool.query(`
            SELECT oi.*, d.name as drug_name, d.requires_prescription, d.batch_id
            FROM order_items oi
            JOIN drugs d ON oi.drug_id = d.id
            WHERE oi.order_id = ?
        `, [orderId]);
        order.items = items;

        const [history] = await pool.query(`
            SELECT h.*, u.username as user_name
            FROM order_history h
            LEFT JOIN users u ON h.changed_by = u.id
            WHERE h.order_id = ?
            ORDER BY h.created_at DESC
        `, [orderId]);
        order.history = history;

        res.json(order);
    } catch (error) {
        console.error('Error in getOrderById:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<any> => {
    const connection = await pool.getConnection();
    try {
        const orderId = req.params.id;
        const { status, reason, payment_status } = req.body;
        const userId = req.user?.id;

        if (!status && !payment_status) {
            return res.status(400).json({ error: 'Status or payment_status required' });
        }

        await connection.beginTransaction();

        const [orders] = await connection.query(`SELECT status, payment_status, customer_id FROM orders WHERE id = ? FOR UPDATE`, [orderId]);
        if ((orders as any[]).length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const currentOrder = (orders as any)[0];
        let updates = [];
        let params = [];
        
        const validTransitions: Record<string, string[]> = {
            'pending': ['confirmed', 'rejected', 'cancelled'],
            'placed': ['confirmed', 'rejected', 'cancelled'],
            'pending_prescription': ['confirmed', 'rejected', 'cancelled'],
            'confirmed': ['preparing', 'processing'],
            'processing': ['ready'],
            'preparing': ['ready'],
            'ready': ['completed']
        };

        if (payment_status && payment_status !== currentOrder.payment_status) {
            updates.push('payment_status = ?');
            params.push(payment_status);
        }

        if (status && status !== currentOrder.status) {
            const allowedNextStates = validTransitions[currentOrder.status as string] || [];
            
            // Allow admin overrides optionally, but for pharmacist strict rules apply
            if (!allowedNextStates.includes(status) && !['cancelled'].includes(status)) {
                await connection.rollback();
                return res.status(400).json({ error: `Invalid transition from ${currentOrder.status} to ${status}` });
            }
            
            if (status === 'rejected' && !reason) {
                await connection.rollback();
                return res.status(400).json({ error: 'Rejection reason is required' });
            }

            // Check prescription and stock on CONFIRMATION
            if (status === 'confirmed') {
                const [items] = await connection.query(`
                    SELECT oi.id, oi.quantity, d.name, d.stock, d.is_active, d.requires_prescription,
                           COALESCE((SELECT SUM(quantity) FROM batches b WHERE b.drug_id = d.id AND b.exp_date > CURDATE()), 0) AS unexpired_qty
                    FROM order_items oi 
                    JOIN drugs d ON oi.drug_id = d.id 
                    WHERE oi.order_id = ?
                `, [orderId]);

                let requiresPrescription = false;

                for (const item of items as any[]) {
                    if (!item.is_active) {
                        await connection.rollback();
                        return res.status(400).json({ error: `Cannot confirm: Product ${item.name} is inactive.` });
                    }
                    if (item.unexpired_qty < item.quantity) {
                        await connection.rollback();
                        return res.status(400).json({ error: `Insufficient unexpired stock for ${item.name}. Requested: ${item.quantity}, Available: ${item.unexpired_qty}.` });
                    }
                    if (item.requires_prescription) {
                        requiresPrescription = true;
                    }
                }

                if (requiresPrescription) {
                    const [prescriptions] = await connection.query(`
                        SELECT status FROM prescriptions WHERE order_id = ?
                    `, [orderId]);

                    if ((prescriptions as any[]).length === 0 || (prescriptions as any)[0].status !== 'approved') {
                        await connection.rollback();
                        return res.status(400).json({ error: 'Cannot confirm order: Prescription not approved.' });
                    }
                }
            }

            updates.push('status = ?');
            params.push(status);

            // Create order history entry
            await connection.query(`
                INSERT INTO order_history (order_id, previous_status, new_status, changed_by, reason) 
                VALUES (?, ?, ?, ?, ?)
            `, [orderId, currentOrder.status, status, userId, reason || 'Status updated by user']);
            
            // Trigger customer notification for order updates
            const messages: Record<string, string> = {
                'confirmed': `Your order ORD-${orderId} has been confirmed.`,
                'preparing': `Your order ORD-${orderId} is being prepared.`,
                'ready': `Your order ORD-${orderId} is ready for pickup or delivery.`,
                'completed': `Your order ORD-${orderId} has been completed.`,
                'cancelled': `Your order ORD-${orderId} has been cancelled.`,
                'rejected': `Your order ORD-${orderId} has been rejected.`
            };
            if (messages[status]) {
                await createNotification(connection, currentOrder.customer_id, 'ORDER', `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`, messages[status], parseInt(orderId));
            }
            
            // If completed, we must deduct inventory and create a sale record
            if (status === 'completed' && currentOrder.status !== 'completed') {
                // 1. Get order items
                const [items] = await connection.query(`SELECT * FROM order_items WHERE order_id = ?`, [orderId]);
                
                // 2. Create Sale
                const sellNo = 'ORD-' + orderId + '-' + Date.now().toString().slice(-4);
                
                // Fetch customer and total
                const [orderData] = await connection.query(`SELECT customer_id, total_amount FROM orders WHERE id = ?`, [orderId]);
                const customerId = (orderData as any)[0].customer_id;
                const totalAmount = (orderData as any)[0].total_amount;
                
                const [saleRes] = await connection.query(`
                    INSERT INTO sales (sell_no, customer_id, user_id, total_amount, payment_method, payment_status, sale_status, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, 'online', 'paid', 'completed', NOW(), NOW())
                `, [sellNo, customerId, userId, totalAmount]);
                const saleId = (saleRes as any).insertId;
                
                // 3. Deduct inventory and insert sale_items
                for (const item of items as any[]) {
                    // Check stock again FOR UPDATE
                    const [drugStock] = await connection.query(`
                        SELECT d.stock as qty, d.name, d.is_active,
                               COALESCE((SELECT SUM(quantity) FROM batches b WHERE b.drug_id = d.id AND b.exp_date > CURDATE()), 0) AS unexpired_qty
                        FROM drugs d WHERE d.id = ? FOR UPDATE
                    `, [item.drug_id]);
                    const currentStock = (drugStock as any[])[0];
                    if (currentStock.qty < item.quantity) {
                        await connection.rollback();
                        return res.status(400).json({ error: 'Insufficient inventory at completion for ' + currentStock.name });
                    }
                    if (currentStock.unexpired_qty < item.quantity || !currentStock.is_active) {
                        await connection.rollback();
                        return res.status(400).json({ error: 'Batch is expired or inactive at completion for ' + currentStock.name });
                    }
                    
                    // Deduct
                    await connection.query(`UPDATE drugs SET stock = stock - ? WHERE id = ?`, [item.quantity, item.drug_id]);
                    
                    // Insert sale item
                    const itemTotal = (item.quantity * item.unit_price) - (item.discount || 0);
                    await connection.query(`
                        INSERT INTO sale_items (sale_id, drug_id, quantity, unit_price, discount, total_price) 
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [saleId, item.drug_id, item.quantity, item.unit_price, item.discount || 0, itemTotal]);
                }
            }
        }

        if (updates.length > 0) {
            params.push(orderId);
            await connection.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);
            
            // Log audit
            logAudit({
                userId: userId,
                action: 'ORDER_STATUS_CHANGE',
                module: 'Orders',
                entityType: 'orders',
                entityId: parseInt(orderId),
                description: `Updated order status/payment: ${status || currentOrder.status}${reason ? ' Reason: '+reason : ''}`,
                oldValue: { status: currentOrder.status, payment_status: currentOrder.payment_status },
                newValue: { status: status || currentOrder.status, payment_status: payment_status || currentOrder.payment_status }
            });
        }

        await connection.commit();
        res.json({ message: 'Order updated successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Error in updateOrderStatus:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
};

export const cancelOrder = async (req: Request, res: Response): Promise<any> => {
    const connection = await pool.getConnection();
    try {
        const orderId = req.params.id;
        const { reason } = req.body;
        const userId = req.user?.id;

        await connection.beginTransaction();

        const [orders] = await connection.query(`SELECT status, customer_id FROM orders WHERE id = ? FOR UPDATE`, [orderId]);
        if ((orders as any[]).length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }
        const currentOrder = (orders as any)[0];
        
        if (['completed', 'delivered', 'cancelled'].includes(currentOrder.status)) {
            await connection.rollback();
            return res.status(400).json({ error: 'Order cannot be cancelled in its current state' });
        }

        await connection.query(`UPDATE orders SET status = 'cancelled' WHERE id = ?`, [orderId]);

        await connection.query(`
            INSERT INTO order_history (order_id, previous_status, new_status, changed_by, reason) 
            VALUES (?, ?, 'cancelled', ?, ?)
        `, [orderId, currentOrder.status, userId, reason || 'Cancelled by Admin']);

        await createNotification(connection, currentOrder.customer_id, 'ORDER', 'Order Cancelled', `Your order ORD-${orderId} has been cancelled.`, parseInt(orderId));

        logAudit({
            userId: userId,
            action: 'ORDER_CANCELLED',
            module: 'Orders',
            entityType: 'orders',
            entityId: parseInt(orderId),
            description: `Order cancelled. Reason: ${reason || 'Cancelled by Admin'}`,
            newValue: { status: 'cancelled' }
        });

        await connection.commit();
        res.json({ message: 'Order cancelled successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Error in cancelOrder:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
};
