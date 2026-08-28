import { Request, Response } from 'express';
import db from '../config/db.js';
import { RowDataPacket } from 'mysql2';
import { logAudit } from '../utils/auditLogger.js';

export const getDrugs = async (req: Request, res: Response): Promise<any> => {
    try {
        const { search, category, status } = req.query;

        let query = `
            SELECT d.*, c.name as category_name
            FROM drugs d
            LEFT JOIN categories c ON d.category_id = c.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (search) {
            query += ' AND (d.name LIKE ? OR d.generic_name LIKE ? OR d.brand_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (category) {
            query += ' AND d.category_id = ?';
            params.push(category);
        }
        if (status) {
            query += ' AND d.is_active = ?';
            params.push(status === 'active' ? 1 : 0);
        }

        query += ' ORDER BY d.created_at DESC';

        const [drugs] = await db.query<RowDataPacket[]>(query, params);
        res.json(drugs);
    } catch (error) {
        console.error('Error fetching drugs:', error);
        res.status(500).json({ error: 'Failed to fetch drugs' });
    }
};

export const getDrugById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const [drugs] = await db.query<RowDataPacket[]>(
            `SELECT d.*, c.name as category_name 
             FROM drugs d 
             LEFT JOIN categories c ON d.category_id = c.id 
             WHERE d.id = ?`, 
            [id]
        );
        
        if (drugs.length === 0) {
            return res.status(404).json({ error: 'Drug not found' });
        }
        
        res.json(drugs[0]);
    } catch (error) {
        console.error('Error fetching drug:', error);
        res.status(500).json({ error: 'Failed to fetch drug' });
    }
};

export const createDrug = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            name, generic_name, brand_name, category_id, manufacturer,
            description, dosage_form, strength, price, requires_prescription,
            is_active, image_url
        } = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: 'Missing required fields (name, price)' });
        }

        const query = `
            INSERT INTO drugs (
                name, generic_name, brand_name, category_id, manufacturer,
                description, dosage_form, strength, price, requires_prescription,
                is_active, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            name,
            generic_name || null,
            brand_name || null,
            category_id || null,
            manufacturer || null,
            description || null,
            dosage_form || null,
            strength || null,
            price,
            requires_prescription ? 1 : 0,
            is_active === 'inactive' ? 0 : 1,
            image_url || null
        ];

        const [result]: any = await db.query(query, values);

        res.status(201).json({ 
            message: 'Drug created successfully',
            drugId: result.insertId
        });

        if (req.user && req.user.id) {
            logAudit({
                userId: req.user.id,
                action: 'CREATE',
                module: 'Drugs',
                entityType: 'drugs',
                entityId: result.insertId,
                description: `Created drug ${name}`
            });
        }
    } catch (error: any) {
        console.error('Error creating drug:', error);
        res.status(500).json({ error: 'Failed to create drug' });
    }
};

export const updateDrug = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const {
            name, generic_name, brand_name, category_id, manufacturer,
            description, dosage_form, strength, price, requires_prescription,
            is_active, image_url
        } = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: 'Missing required fields (name, price)' });
        }

        const query = `
            UPDATE drugs SET
                name = ?, generic_name = ?, brand_name = ?, category_id = ?, manufacturer = ?,
                description = ?, dosage_form = ?, strength = ?, price = ?, requires_prescription = ?,
                is_active = ?, image_url = ?
            WHERE id = ?
        `;

        const values = [
            name,
            generic_name || null,
            brand_name || null,
            category_id || null,
            manufacturer || null,
            description || null,
            dosage_form || null,
            strength || null,
            price,
            requires_prescription ? 1 : 0,
            is_active === 'inactive' ? 0 : 1,
            image_url || null,
            id
        ];

        const [result]: any = await db.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Drug not found' });
        }

        if (req.user && req.user.id) {
            logAudit({
                userId: req.user.id,
                action: 'UPDATE',
                module: 'Drugs',
                entityType: 'drugs',
                entityId: parseInt(id),
                description: `Updated drug ${name}`
            });
        }

        res.json({ message: 'Drug updated successfully' });
    } catch (error) {
        console.error('Error updating drug:', error);
        res.status(500).json({ error: 'Failed to update drug' });
    }
};

export const updateDrugStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const [result]: any = await db.query('UPDATE drugs SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Drug not found' });
        }

        res.json({ message: 'Drug status updated successfully' });
    } catch (error) {
        console.error('Error updating drug status:', error);
        res.status(500).json({ error: 'Failed to update drug status' });
    }
};
