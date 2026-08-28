import { Request, Response } from 'express';
import pool from '../config/db';
import path from 'path';
import fs from 'fs';
import { logAudit } from '../utils/auditLogger.js';

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
