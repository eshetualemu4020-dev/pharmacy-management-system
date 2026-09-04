import { Request, Response } from 'express';
import pool from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { logAudit } from '../utils/auditLogger.js';
import { createNotification } from './notificationController.js';

export const getMyPrescriptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        const { search, status, sort, page = '1', limit = '10' } = req.query;

        let query = `
            SELECT 
                p.id, p.order_id, p.status, p.created_at, p.updated_at, p.review_notes,
                o.status as order_status, o.total_amount
            FROM prescriptions p
            JOIN orders o ON p.order_id = o.id
            WHERE o.customer_id = ?
        `;
        const queryParams: any[] = [customerId];

        if (search) {
            query += ` AND (p.id LIKE ? OR o.id LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (status && status !== 'All') {
            query += ` AND p.status = ?`;
            queryParams.push(status.toString().toLowerCase());
        }

        if (sort === 'oldest') {
            query += ` ORDER BY p.created_at ASC`;
        } else {
            query += ` ORDER BY p.created_at DESC`;
        }

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit as string), offset);

        const [rows] = await pool.query(query, queryParams);

        // Count for pagination
        let countQuery = `
            SELECT COUNT(p.id) as total 
            FROM prescriptions p
            JOIN orders o ON p.order_id = o.id
            WHERE o.customer_id = ?
        `;
        const countParams: any[] = [customerId];
        
        if (search) {
            countQuery += ` AND (p.id LIKE ? OR o.id LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`);
        }
        if (status && status !== 'All') {
            countQuery += ` AND p.status = ?`;
            countParams.push(status.toString().toLowerCase());
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
        console.error('Error fetching customer prescriptions:', error);
        res.status(500).json({ error: 'Unable to load prescriptions' });
    }
};

export const getMyPrescriptionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        const prescId = req.params.id;

        const [prescriptions] = await pool.query(`
            SELECT 
                p.id, p.order_id, p.status, p.created_at, p.updated_at, p.review_notes,
                o.status as order_status, o.total_amount, o.delivery_address, o.created_at as order_date
            FROM prescriptions p
            JOIN orders o ON p.order_id = o.id
            WHERE p.id = ? AND o.customer_id = ?
        `, [prescId, customerId]);

        if ((prescriptions as any[]).length === 0) {
            res.status(404).json({ error: 'Prescription not found or unauthorized' });
            return;
        }

        const prescription = (prescriptions as any)[0];

        // Fetch the drugs in the order that required the prescription
        const [drugs] = await pool.query(`
            SELECT 
                oi.id as order_item_id, d.name as drug_name, d.generic_name, 
                oi.quantity, oi.unit_price, d.requires_prescription
            FROM order_items oi
            JOIN drugs d ON oi.drug_id = d.id
            WHERE oi.order_id = ? AND d.requires_prescription = TRUE
        `, [prescription.order_id]);

        prescription.ordered_drugs = drugs;

        res.json(prescription);
    } catch (error: any) {
        console.error('Error fetching prescription details:', error);
        res.status(500).json({ error: 'Unable to load prescription details' });
    }
};

export const getMyPrescriptionFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        const prescId = req.params.id;

        // Verify ownership before serving file
        const [rows] = await pool.query(`
            SELECT p.file_url 
            FROM prescriptions p
            JOIN orders o ON p.order_id = o.id
            WHERE p.id = ? AND o.customer_id = ?
        `, [prescId, customerId]);

        if ((rows as any[]).length === 0) {
            res.status(404).json({ error: 'Prescription not found or unauthorized' });
            return;
        }

        let fileUrl = (rows as any)[0].file_url;
        if (fileUrl.startsWith('/')) fileUrl = fileUrl.substring(1);

        const absolutePath = path.resolve(process.cwd(), fileUrl);

        if (!fs.existsSync(absolutePath)) {
            res.status(404).json({ error: 'File not found on server' });
            return;
        }

        res.sendFile(absolutePath);
    } catch (error: any) {
        console.error('Error serving prescription file:', error);
        res.status(500).json({ error: 'Unable to load prescription file' });
    }
};

export const uploadPrescription = async (req: Request, res: Response): Promise<void> => {
    const connection = await pool.getConnection();
    try {
        const customerId = (req as any).user.id;
        const { order_id } = req.body;
        const file = req.file;

        if (!file) {
            res.status(400).json({ error: 'Prescription file is required' });
            return;
        }

        if (!order_id) {
            fs.unlinkSync(file.path); // clean up uploaded file
            res.status(400).json({ error: 'Related order ID is required' });
            return;
        }

        await connection.beginTransaction();

        // 1. Verify order exists and belongs to customer
        const [orders] = await connection.query(`
            SELECT id, status FROM orders WHERE id = ? AND customer_id = ? FOR UPDATE
        `, [order_id, customerId]);

        if ((orders as any[]).length === 0) {
            await connection.rollback();
            fs.unlinkSync(file.path);
            res.status(404).json({ error: 'Order not found or unauthorized' });
            return;
        }

        const order = (orders as any)[0];

        // 2. Verify order requires a prescription
        const [items] = await connection.query(`
            SELECT 1 
            FROM order_items oi
            JOIN drugs d ON oi.drug_id = d.id
            WHERE oi.order_id = ? AND d.requires_prescription = TRUE
            LIMIT 1
        `, [order_id]);

        if ((items as any[]).length === 0) {
            await connection.rollback();
            fs.unlinkSync(file.path);
            res.status(400).json({ error: 'This order does not contain any prescription-required medicines' });
            return;
        }

        // 3. Verify order is in a valid state to receive a prescription (e.g., placed or pending_prescription)
        if (!['placed', 'pending_prescription'].includes(order.status)) {
            await connection.rollback();
            fs.unlinkSync(file.path);
            res.status(400).json({ error: 'Order is not in a valid state to receive a prescription' });
            return;
        }

        // 4. Check if order already has an active (pending or approved) prescription
        const [existing] = await connection.query(`
            SELECT id, status FROM prescriptions 
            WHERE order_id = ? AND status IN ('pending', 'approved', 'under_review')
        `, [order_id]);

        if ((existing as any[]).length > 0) {
            await connection.rollback();
            fs.unlinkSync(file.path);
            res.status(400).json({ error: 'This order already has an active prescription attached' });
            return;
        }

        // 5. Store prescription record
        // The file is already stored by multer in 'uploads/prescriptions/'
        const fileUrl = path.join('uploads', 'prescriptions', file.filename).replace(/\\/g, '/');

        const [result] = await connection.query(`
            INSERT INTO prescriptions (order_id, file_url, status)
            VALUES (?, ?, 'pending')
        `, [order_id, fileUrl]);

        const prescId = (result as any).insertId;

        // 6. Update order status to pending_prescription if it isn't already
        if (order.status === 'placed') {
            await connection.query(`
                UPDATE orders SET status = 'pending_prescription' WHERE id = ?
            `, [order_id]);
            
            await connection.query(`
                INSERT INTO order_history (order_id, previous_status, new_status, changed_by, reason) 
                VALUES (?, 'placed', 'pending_prescription', NULL, 'Prescription uploaded')
            `, [order_id]);
        }

        await createNotification(connection, customerId, 'PRESCRIPTION', 'Prescription Submitted', `Your prescription for order ORD-${order_id} has been submitted successfully and is pending review.`, prescId);

        await connection.commit();
        res.status(201).json({ message: 'Prescription submitted successfully', id: prescId });
    } catch (error: any) {
        await connection.rollback();
        if (req.file) {
            fs.unlinkSync(req.file.path); // clean up file on error
        }
        console.error('Error uploading prescription:', error);
        res.status(500).json({ error: 'Unable to submit prescription' });
    } finally {
        connection.release();
    }
};

export const getEligibleOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;

        // Find orders belonging to customer that:
        // 1. Are in 'placed' or 'pending_prescription' status
        // 2. Have prescription-required items
        // 3. DO NOT already have a pending or approved prescription
        const query = `
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
        `;

        const [orders] = await pool.query(query, [customerId]);
        res.json(orders);
    } catch (error: any) {
        console.error('Error fetching eligible orders:', error);
        res.status(500).json({ error: 'Unable to load eligible orders' });
    }
};
