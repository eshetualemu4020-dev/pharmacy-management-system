import { Request, Response } from 'express';
import pool from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { logAudit } from '../utils/auditLogger.js';

export const getPurchaseOrders = async (req: Request, res: Response): Promise<any> => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT po.*, s.name as supplier_name, u.username as created_by_username
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.id
            JOIN users u ON po.created_by = u.id
            ORDER BY po.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching purchase orders' });
    }
};

export const getPurchaseOrderById = async (req: Request, res: Response): Promise<any> => {
    try {
        const [poRows] = await pool.query<RowDataPacket[]>(`
            SELECT po.*, s.name as supplier_name, u.username as created_by_username
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.id
            JOIN users u ON po.created_by = u.id
            WHERE po.id = ?
        `, [req.params.id]);

        if (poRows.length === 0) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }

        const [itemRows] = await pool.query<RowDataPacket[]>(`
            SELECT * FROM purchase_order_items WHERE purchase_order_id = ?
        `, [req.params.id]);

        res.json({ ...poRows[0], items: itemRows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching purchase order' });
    }
};

export const createPurchaseOrder = async (req: Request, res: Response): Promise<any> => {
    const { supplier_id, expected_delivery_date, notes, items } = req.body;
    
    if (!supplier_id || !items || items.length === 0) {
        return res.status(400).json({ error: 'Supplier and at least one item are required' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const po_number = 'PO-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const order_date = new Date().toISOString().split('T')[0];

        let total_amount = 0;
        for (const item of items) {
            total_amount += (Number(item.quantity) * Number(item.unit_cost));
        }

        const [poResult] = await connection.query<ResultSetHeader>(
            `INSERT INTO purchase_orders (supplier_id, created_by, po_number, order_date, expected_delivery_date, total_amount, notes, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [supplier_id, req.user.id, po_number, order_date, expected_delivery_date || null, total_amount, notes || '']
        );

        const poId = poResult.insertId;

        for (const item of items) {
            await connection.query(
                `INSERT INTO purchase_order_items (purchase_order_id, drug_name, quantity_ordered, unit_cost) VALUES (?, ?, ?, ?)`,
                [poId, item.drug_name, item.quantity, item.unit_cost]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Purchase order created successfully', id: poId });

        if (req.user && req.user.id) {
            logAudit({
                userId: req.user.id,
                action: 'PURCHASE_ORDER_STATUS_CHANGE',
                module: 'Purchase Orders',
                entityType: 'purchase_orders',
                entityId: poId,
                description: `Created purchase order ${po_number}`,
                newValue: { status: 'pending' }
            });
        }
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Server error creating purchase order' });
    } finally {
        connection.release();
    }
};

export const updatePurchaseOrderStatus = async (req: Request, res: Response): Promise<any> => {
    const { status } = req.body;
    try {
        await pool.query(`UPDATE purchase_orders SET status = ? WHERE id = ?`, [status, req.params.id]);
        res.json({ message: 'Status updated' });

        if (req.user && req.user.id) {
            logAudit({
                userId: req.user.id,
                action: 'PURCHASE_ORDER_STATUS_CHANGE',
                module: 'Purchase Orders',
                entityType: 'purchase_orders',
                entityId: parseInt(req.params.id),
                description: `Purchase order #${req.params.id} status changed to ${status}`,
                newValue: { status }
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating status' });
    }
};

export const receivePurchaseOrder = async (req: Request, res: Response): Promise<any> => {
    const { items } = req.body; // Array of { id: item_id, quantity_received, batch_id, mfg_date, exp_date, retail_price, category_id }
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let allReceived = true;
        let anyReceived = false;

        for (const item of items) {
            if (item.quantity_received > 0) {
                anyReceived = true;
                
                // 1. Update purchase_order_items
                await connection.query(
                    `UPDATE purchase_order_items SET quantity_received = ? WHERE id = ?`,
                    [item.quantity_received, item.id]
                );

                // 2. Check if batch already exists in drugs
                const [existingBatch] = await connection.query<RowDataPacket[]>(
                    `SELECT id, qty FROM drugs WHERE batch_id = ?`,
                    [item.batch_id]
                );

                if (existingBatch.length > 0) {
                    // Update qty
                    await connection.query(
                        `UPDATE drugs SET qty = qty + ? WHERE id = ?`,
                        [item.quantity_received, existingBatch[0].id]
                    );
                    
                    // Link drug to PO item
                    await connection.query(
                        `UPDATE purchase_order_items SET drug_id = ? WHERE id = ?`,
                        [existingBatch[0].id, item.id]
                    );
                } else {
                    // Create new drug/batch record
                    // First get the item details to know the name
                    const [poItemRows] = await connection.query<RowDataPacket[]>(
                        `SELECT drug_name FROM purchase_order_items WHERE id = ?`,
                        [item.id]
                    );
                    const drugName = poItemRows[0].drug_name;

                    const [insertResult] = await connection.query<ResultSetHeader>(
                        `INSERT INTO drugs (name, batch_id, category_id, qty, price, mfg_date, exp_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [drugName, item.batch_id, item.category_id || null, item.quantity_received, item.retail_price, item.mfg_date, item.exp_date]
                    );

                    // Link drug to PO item
                    await connection.query(
                        `UPDATE purchase_order_items SET drug_id = ? WHERE id = ?`,
                        [insertResult.insertId, item.id]
                    );
                }
            } else {
                allReceived = false; // if an item didn't receive anything
            }
        }

        // Update PO status
        const status = allReceived ? 'received' : (anyReceived ? 'partially_received' : 'ordered');
        await connection.query(`UPDATE purchase_orders SET status = ? WHERE id = ?`, [status, req.params.id]);

        await connection.commit();
        res.json({ message: 'Items received successfully' });

        if (req.user && req.user.id) {
            logAudit({
                userId: req.user.id,
                action: 'PURCHASE_ORDER_STATUS_CHANGE',
                module: 'Purchase Orders',
                entityType: 'purchase_orders',
                entityId: parseInt(req.params.id),
                description: `Purchase order #${req.params.id} received items`,
                newValue: { status: 'received' }
            });
        }
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Server error receiving purchase order' });
    } finally {
        connection.release();
    }
};
