import { Request, Response } from 'express';
import db from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export const getWishlist = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

        const [wishlist] = await db.query<RowDataPacket[]>(`
            SELECT w.id as wishlist_id, d.id, d.name, d.generic_name, d.brand_name, 
                   d.dosage_form, d.strength, d.price, d.requires_prescription, 
                   d.stock as qty, d.image_url, d.is_active, d.category_id
            FROM wishlist_items w
            JOIN drugs d ON w.drug_id = d.id
            WHERE w.customer_id = ?
            ORDER BY w.added_at DESC
        `, [customerId]);

        res.json(wishlist);
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
};

export const addToWishlist = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const { drugId } = req.body;

        if (!customerId) return res.status(401).json({ error: 'Unauthorized' });
        if (!drugId) return res.status(400).json({ error: 'Drug ID is required' });

        // Check if drug exists
        const [drugs] = await db.query<RowDataPacket[]>('SELECT id FROM drugs WHERE id = ?', [drugId]);
        if (drugs.length === 0) return res.status(404).json({ error: 'Product not found' });

        // Add to wishlist (ignore duplicate)
        await db.query(`
            INSERT IGNORE INTO wishlist_items (customer_id, drug_id)
            VALUES (?, ?)
        `, [customerId, drugId]);

        res.status(201).json({ message: 'Added to wishlist' });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
};

export const removeFromWishlist = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const { drugId } = req.params;

        if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

        await db.query('DELETE FROM wishlist_items WHERE customer_id = ? AND drug_id = ?', [customerId, drugId]);

        res.json({ message: 'Removed from wishlist' });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
};
