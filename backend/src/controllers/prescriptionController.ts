import { Request, Response } from 'express';
import pool from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { logAudit } from '../utils/auditLogger.js';
import { createNotification } from './notificationController.js';

export const getAllPrescriptions = async (req: Request, res: Response): Promise<any> => {
    try {
        const { search = '', status = '', from = '', to = '', pharmacistId = '' } = req.query;
        
        let query = `
            SELECT 
                p.id, p.order_id, p.status, p.created_at, p.updated_at, p.review_notes,
                c.id as customer_id, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
                o.status as order_status, o.total_amount,
                u.id as pharmacist_id, u.username as pharmacist_name
            FROM prescriptions p
            JOIN orders o ON p.order_id = o.id
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN users u ON p.reviewed_by = u.id
            WHERE 1=1
        `;
        
        const queryParams: any[] = [];
        
        if (search) {
            query += ` AND (p.id = ? OR o.id = ? OR c.name LIKE ? OR c.email LIKE ?)`;
            queryParams.push(search, search, `%${search}%`, `%${search}%`);
        }
        
        if (status) {
            query += ` AND p.status = ?`;
            queryParams.push(status);
        }

        if (from) {
            query += ` AND DATE(p.created_at) >= ?`;
            queryParams.push(from);
        }

        if (to) {
            query += ` AND DATE(p.created_at) <= ?`;
            queryParams.push(to);
        }

        if (pharmacistId) {
            query += ` AND p.reviewed_by = ?`;
            queryParams.push(pharmacistId);
        }
        
        query += ` ORDER BY p.created_at DESC`;

        const [rows] = await pool.query(query, queryParams);
        
        return res.json(rows);
    } catch (error: any) {
        console.error('Error fetching prescriptions:', error);
        return res.status(500).json({ error: 'Server Error: ' + error.message });
    }
};

export const getPrescriptionById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        
        const [prescriptions] = await pool.query(`
            SELECT 
                p.id, p.order_id, p.status, p.created_at, p.updated_at, p.review_notes,
                c.id as customer_id, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
                o.status as order_status, o.total_amount, o.delivery_address, o.created_at as order_date,
                u.id as pharmacist_id, u.username as pharmacist_name
            FROM prescriptions p
            JOIN orders o ON p.order_id = o.id
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN users u ON p.reviewed_by = u.id
            WHERE p.id = ?
        `, [id]);
        
        const prescList = prescriptions as any[];
        if (prescList.length === 0) {
            return res.status(404).json({ error: 'Prescription not found.' });
        }
        
        const prescription = prescList[0];
        
        const [drugs] = await pool.query(`
            SELECT 
                oi.id as order_item_id, d.name as drug_name, d.generic_name, 
                oi.quantity, oi.unit_price, d.requires_prescription
            FROM order_items oi
            JOIN drugs d ON oi.drug_id = d.id
            WHERE oi.order_id = ? AND d.requires_prescription = TRUE
        `, [prescription.order_id]);
        
        prescription.ordered_drugs = drugs;

        const adminId = (req as any).user.id;
        logAudit({
            userId: adminId,
            action: 'VIEW_PRESCRIPTION',
            module: 'Prescriptions',
            entityType: 'prescriptions',
            entityId: prescription.id,
            description: `Admin viewed prescription details.`
        });

        return res.json(prescription);
    } catch (error: any) {
        console.error('Error fetching prescription details:', error);
        return res.status(500).json({ error: 'Server Error: ' + error.message });
    }
};

export const getPrescriptionFile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.query(`
            SELECT file_url FROM prescriptions WHERE id = ?
        `, [id]);
        
        const prescList = rows as any[];
        if (prescList.length === 0) {
            return res.status(404).json({ error: 'Prescription not found.' });
        }
        
        let fileUrl = prescList[0].file_url;
        // Basic normalization if stored differently
        if (fileUrl.startsWith('/')) fileUrl = fileUrl.substring(1);
        
        const absolutePath = path.resolve(process.cwd(), fileUrl);
        
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'File not found on server.' });
        }
        
        const adminId = (req as any).user.id;
        logAudit({
            userId: adminId,
            action: 'VIEW_PRESCRIPTION_FILE',
            module: 'Prescriptions',
            entityType: 'prescriptions',
            entityId: parseInt(id, 10),
            description: `Admin viewed prescription file.`
        });

        return res.sendFile(absolutePath);
    } catch (error: any) {
        console.error('Error fetching prescription file:', error);
        return res.status(500).json({ error: 'Server Error: ' + error.message });
    }
};

export const updatePrescriptionStatus = async (req: Request, res: Response): Promise<any> => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const userId = (req as any).user.id;

        if (!['under_review', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        if (status === 'rejected' && !notes) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        await connection.beginTransaction();

        const [prescriptions] = await connection.query(`
            SELECT p.id, p.status, p.order_id, o.customer_id 
            FROM prescriptions p
            JOIN orders o ON p.order_id = o.id
            WHERE p.id = ? FOR UPDATE
        `, [id]);

        const prescList = prescriptions as any[];
        if (prescList.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Prescription not found' });
        }

        const prescription = prescList[0];

        if (prescription.status === 'approved' || prescription.status === 'rejected') {
            await connection.rollback();
            return res.status(400).json({ error: 'Prescription is already ' + prescription.status });
        }

        // Only allow moving to under_review from pending
        if (status === 'under_review' && prescription.status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({ error: 'Can only start review for pending prescriptions' });
        }

        // Only allow moving to approved/rejected from under_review or pending
        if ((status === 'approved' || status === 'rejected') && (prescription.status !== 'pending' && prescription.status !== 'under_review')) {
             await connection.rollback();
             return res.status(400).json({ error: 'Prescription must be pending or under review' });
        }

        await connection.query(`
            UPDATE prescriptions 
            SET status = ?, reviewed_by = ?, review_notes = ? 
            WHERE id = ?
        `, [status, userId, notes || null, id]);

        const actionString = status === 'approved' ? 'APPROVE_PRESCRIPTION' : 
                             status === 'rejected' ? 'REJECT_PRESCRIPTION' : 'REVIEW_PRESCRIPTION';

        logAudit({
            userId: userId,
            action: actionString,
            module: 'Prescriptions',
            entityType: 'prescriptions',
            entityId: parseInt(id, 10),
            description: `Pharmacist/Admin updated prescription status to ${status}. Notes: ${notes || ''}`
        });

        if (status === 'approved') {
            await createNotification(connection, prescription.customer_id, 'PRESCRIPTION', 'Prescription Approved', `Your prescription for order ORD-${prescription.order_id} has been approved.`, parseInt(id, 10));
        } else if (status === 'rejected') {
            await createNotification(connection, prescription.customer_id, 'PRESCRIPTION', 'Prescription Rejected', `Your prescription for order ORD-${prescription.order_id} was rejected. Reason: ${notes || 'Not provided'}`, parseInt(id, 10));
        }

        await connection.commit();
        return res.json({ message: 'Prescription status updated successfully', status });
    } catch (error: any) {
        await connection.rollback();
        console.error('Error updating prescription status:', error);
        return res.status(500).json({ error: 'Server Error: ' + error.message });
    } finally {
        connection.release();
    }
};
