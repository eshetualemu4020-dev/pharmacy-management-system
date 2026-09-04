import { Request, Response } from 'express';
import pool from '../config/db.js';
import { ResultSetHeader } from 'mysql2';
import { logAudit } from '../utils/auditLogger.js';

export const getAllPromotions = async (req: Request, res: Response): Promise<any> => {
    try {
        let { search, status, type } = req.query;
        
        if (req.user?.role === 'customer') {
            status = 'active';
        }

        let query = `
            SELECT p.*, u.username as created_by_name
            FROM promotions p
            LEFT JOIN users u ON p.created_by = u.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (search) {
            query += ` AND (p.name LIKE ? OR p.id = ?)`;
            params.push(`%${search}%`, search);
        }
        if (status) {
            query += ` AND p.status = ?`;
            params.push(status);
        }
        if (type) {
            query += ` AND p.discount_type = ?`;
            params.push(type);
        }

        query += ` ORDER BY p.created_at DESC`;
        
        const [promotions] = await pool.query(query, params);
        
        // Compute dynamic status based on dates if active/scheduled
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let rows = (promotions as any[]).map(p => {
            let currentStatus = p.status;
            
            if (p.status !== 'draft' && p.status !== 'inactive') {
                const startDate = new Date(p.start_date);
                const endDate = new Date(p.end_date);
                
                if (today < startDate) currentStatus = 'scheduled';
                else if (today > endDate) currentStatus = 'expired';
                else currentStatus = 'active';
            }
            
            return { ...p, current_status: currentStatus };
        });

        if (req.user?.role === 'customer') {
            rows = rows.filter(r => r.current_status === 'active');
        }

        return res.json(rows);
    } catch (error: any) {
        console.error('Error fetching promotions:', error);
        return res.status(500).json({ error: 'Server Error' });
    }
};

export const getPromotionById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        
        const [promotions] = await pool.query(`
            SELECT p.*, u.username as created_by_name
            FROM promotions p
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.id = ?
        `, [id]);
        
        if ((promotions as any[]).length === 0) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        const promotion = (promotions as any)[0];
        
        // Dynamic status
        let currentStatus = promotion.status;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (promotion.status !== 'draft' && promotion.status !== 'inactive') {
            const startDate = new Date(promotion.start_date);
            const endDate = new Date(promotion.end_date);
            if (today < startDate) currentStatus = 'scheduled';
            else if (today > endDate) currentStatus = 'expired';
            else currentStatus = 'active';
        }
        
        if (req.user?.role === 'customer' && currentStatus !== 'active') {
            return res.status(403).json({ error: 'Promotion not accessible' });
        }
        
        promotion.current_status = currentStatus;

        // Fetch related drugs
        const [drugs] = await pool.query(`
            SELECT d.id, d.name, d.generic_name, c.name as category_name
            FROM promotion_drugs pd
            JOIN drugs d ON pd.drug_id = d.id
            LEFT JOIN categories c ON d.category_id = c.id
            WHERE pd.promotion_id = ?
        `, [id]);
        promotion.drugs = drugs;

        // Fetch related categories
        const [categories] = await pool.query(`
            SELECT c.id, c.name, c.description
            FROM promotion_categories pc
            JOIN categories c ON pc.category_id = c.id
            WHERE pc.promotion_id = ?
        `, [id]);
        promotion.categories = categories;

        return res.json(promotion);
    } catch (error: any) {
        console.error('Error fetching promotion:', error);
        return res.status(500).json({ error: 'Server Error' });
    }
};

export const createPromotion = async (req: Request, res: Response): Promise<any> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { name, description, discount_type, discount_value, start_date, end_date, status, drug_ids, category_ids } = req.body;
        const adminId = (req as any).user.id;

        // Validation
        if (!name || !discount_type || discount_value === undefined || !start_date || !end_date) {
            throw new Error('Missing required fields');
        }

        if (discount_type === 'percentage' && (discount_value <= 0 || discount_value > 100)) {
            throw new Error('Percentage discount must be between 1 and 100');
        }
        
        if (discount_type === 'fixed' && discount_value <= 0) {
            throw new Error('Fixed discount must be greater than 0');
        }

        if (new Date(start_date) > new Date(end_date)) {
            throw new Error('Start date cannot be after end date');
        }

        const [result] = await connection.query<ResultSetHeader>(`
            INSERT INTO promotions (name, description, discount_type, discount_value, start_date, end_date, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, description || null, discount_type, discount_value, start_date, end_date, status || 'draft', adminId]);
        
        const promotionId = result.insertId;

        if (drug_ids && drug_ids.length > 0) {
            const drugValues = drug_ids.map((id: number) => [promotionId, id]);
            await connection.query(`INSERT INTO promotion_drugs (promotion_id, drug_id) VALUES ?`, [drugValues]);
        }

        if (category_ids && category_ids.length > 0) {
            const catValues = category_ids.map((id: number) => [promotionId, id]);
            await connection.query(`INSERT INTO promotion_categories (promotion_id, category_id) VALUES ?`, [catValues]);
        }

        await connection.commit();
        
        logAudit({
            userId: adminId,
            action: 'PROMOTION_CHANGE',
            module: 'Promotions',
            entityType: 'promotions',
            entityId: promotionId,
            description: `Created promotion: ${name}`
        });

        return res.status(201).json({ message: 'Promotion created successfully', promotionId });
    } catch (error: any) {
        await connection.rollback();
        console.error('Error creating promotion:', error);
        return res.status(400).json({ error: error.message || 'Server Error' });
    } finally {
        connection.release();
    }
};

export const updatePromotion = async (req: Request, res: Response): Promise<any> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { name, description, discount_type, discount_value, start_date, end_date, status, drug_ids, category_ids } = req.body;
        const adminId = (req as any).user.id;

        // Validation
        if (discount_type === 'percentage' && (discount_value <= 0 || discount_value > 100)) {
            throw new Error('Percentage discount must be between 1 and 100');
        }
        if (discount_type === 'fixed' && discount_value <= 0) {
            throw new Error('Fixed discount must be greater than 0');
        }
        if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
            throw new Error('Start date cannot be after end date');
        }

        await connection.query(`
            UPDATE promotions
            SET name = ?, description = ?, discount_type = ?, discount_value = ?, start_date = ?, end_date = ?, status = ?
            WHERE id = ?
        `, [name, description || null, discount_type, discount_value, start_date, end_date, status, id]);

        // Update relationships: delete old, insert new
        await connection.query(`DELETE FROM promotion_drugs WHERE promotion_id = ?`, [id]);
        if (drug_ids && drug_ids.length > 0) {
            const drugValues = drug_ids.map((dId: number) => [id, dId]);
            await connection.query(`INSERT INTO promotion_drugs (promotion_id, drug_id) VALUES ?`, [drugValues]);
        }

        await connection.query(`DELETE FROM promotion_categories WHERE promotion_id = ?`, [id]);
        if (category_ids && category_ids.length > 0) {
            const catValues = category_ids.map((cId: number) => [id, cId]);
            await connection.query(`INSERT INTO promotion_categories (promotion_id, category_id) VALUES ?`, [catValues]);
        }

        await connection.commit();
        
        logAudit({
            userId: adminId,
            action: 'PROMOTION_CHANGE',
            module: 'Promotions',
            entityType: 'promotions',
            entityId: parseInt(id),
            description: `Updated promotion: ${name}`
        });

        return res.json({ message: 'Promotion updated successfully' });
    } catch (error: any) {
        await connection.rollback();
        console.error('Error updating promotion:', error);
        return res.status(400).json({ error: error.message || 'Server Error' });
    } finally {
        connection.release();
    }
};

export const updatePromotionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const adminId = (req as any).user.id;

        const [result] = await pool.query<ResultSetHeader>(`UPDATE promotions SET status = ? WHERE id = ?`, [status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        logAudit({
            userId: adminId,
            action: 'PROMOTION_CHANGE',
            module: 'Promotions',
            entityType: 'promotions',
            entityId: parseInt(id),
            description: `Promotion ${id} status changed to ${status}`,
            newValue: { status }
        });

        return res.json({ message: `Promotion status updated to ${status}` });
    } catch (error: any) {
        console.error('Error updating promotion status:', error);
        return res.status(500).json({ error: 'Server Error' });
    }
};

// Utility function to calculate promotion discount given a list of items
export const calculatePromotionDiscount = async (promotionId: number, items: { drug_id: number; quantity: number; unit_price: number }[]) => {
    if (!promotionId) return { discount: 0 };
    
    const [promotions] = await pool.query(`SELECT * FROM promotions WHERE id = ?`, [promotionId]);
    if ((promotions as any[]).length === 0) throw new Error('Promotion not found');
    const promotion = (promotions as any)[0];
    
    // Check if active
    if (promotion.status !== 'active') throw new Error('Promotion is not active');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);
    
    if (today < startDate || today > endDate) throw new Error('Promotion is expired or not yet started');

    // Fetch applicable drugs and categories
    const [promoDrugs] = await pool.query(`SELECT drug_id FROM promotion_drugs WHERE promotion_id = ?`, [promotionId]);
    const applicableDrugIds = new Set((promoDrugs as any[]).map(d => d.drug_id));

    const [promoCats] = await pool.query(`SELECT category_id FROM promotion_categories WHERE promotion_id = ?`, [promotionId]);
    const applicableCategoryIds = new Set((promoCats as any[]).map(c => c.category_id));

    // Determine which items in cart are eligible
    let totalEligibleSubtotal = 0;
    
    for (const item of items) {
        const [drugRows] = await pool.query(`SELECT category_id FROM drugs WHERE id = ?`, [item.drug_id]);
        if ((drugRows as any[]).length === 0) continue;
        
        const drug = (drugRows as any)[0];
        
        const isEligible = applicableDrugIds.has(item.drug_id) || (drug.category_id && applicableCategoryIds.has(drug.category_id));
        
        if (isEligible) {
            totalEligibleSubtotal += (item.quantity * item.unit_price);
        }
    }

    if (totalEligibleSubtotal === 0) {
        return { discount: 0, message: 'No eligible items in cart' };
    }

    let discount = 0;
    if (promotion.discount_type === 'percentage') {
        discount = (totalEligibleSubtotal * parseFloat(promotion.discount_value)) / 100;
    } else if (promotion.discount_type === 'fixed') {
        discount = parseFloat(promotion.discount_value);
        if (discount > totalEligibleSubtotal) discount = totalEligibleSubtotal;
    }

    return { discount };
};
