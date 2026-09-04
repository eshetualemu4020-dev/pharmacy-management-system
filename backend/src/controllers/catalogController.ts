import { Request, Response } from 'express';
import db from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export const getCatalog = async (req: Request, res: Response): Promise<any> => {
    try {
        const { search, category, prescription, availability, dosage_form, minPrice, maxPrice, sort, page, limit } = req.query;

        let query = `
            SELECT d.id, d.name, d.generic_name, d.brand_name, d.description, 
                   d.dosage_form, d.strength, d.price, d.requires_prescription, 
                   d.stock as qty, d.image_url, c.name as category_name
            FROM drugs d
            LEFT JOIN categories c ON d.category_id = c.id
            WHERE d.is_active = 1
        `;
        const params: any[] = [];

        if (search) {
            query += ' AND (d.name LIKE ? OR d.generic_name LIKE ? OR d.brand_name LIKE ? OR c.name LIKE ?)';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }
        if (category) {
            query += ' AND d.category_id = ?';
            params.push(category);
        }
        if (prescription) {
            if (prescription === 'required') {
                query += ' AND d.requires_prescription = 1';
            } else if (prescription === 'not_required') {
                query += ' AND d.requires_prescription = 0';
            }
        }
        if (availability) {
            if (availability === 'in_stock') {
                query += ' AND d.stock > 0';
            } else if (availability === 'out_of_stock') {
                query += ' AND d.stock <= 0';
            }
        }
        if (dosage_form) {
            query += ' AND d.dosage_form = ?';
            params.push(dosage_form);
        }
        if (minPrice) {
            query += ' AND d.price >= ?';
            params.push(Number(minPrice));
        }
        if (maxPrice) {
            query += ' AND d.price <= ?';
            params.push(Number(maxPrice));
        }

        // Count query for pagination
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subset`;
        const [countResult] = await db.query<RowDataPacket[]>(countQuery, params);
        const total = countResult[0].total;

        // Sorting
        switch (sort) {
            case 'name_asc': query += ' ORDER BY d.name ASC'; break;
            case 'name_desc': query += ' ORDER BY d.name DESC'; break;
            case 'price_asc': query += ' ORDER BY d.price ASC'; break;
            case 'price_desc': query += ' ORDER BY d.price DESC'; break;
            case 'newest': query += ' ORDER BY d.id DESC'; break; // use id as proxy for created_at
            default: query += ' ORDER BY d.name ASC'; break;
        }

        // Pagination
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 12;
        const offset = (pageNum - 1) * limitNum;

        query += ' LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

        const [drugs] = await db.query<RowDataPacket[]>(query, params);

        res.json({
            drugs,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching catalog:', error);
        res.status(500).json({ error: 'Failed to fetch catalog' });
    }
};

export const getCatalogDrugById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const [drugs] = await db.query<RowDataPacket[]>(
            `SELECT d.id, d.name, d.generic_name, d.brand_name, d.description, d.composition, d.manufacturer,
                   d.dosage_form, d.strength, d.price, d.requires_prescription, 
                   d.stock as qty, d.image_url, d.category_id, c.name as category_name
             FROM drugs d 
             LEFT JOIN categories c ON d.category_id = c.id 
             WHERE d.id = ? AND d.is_active = 1`, 
            [id]
        );
        
        if (drugs.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(drugs[0]);
    } catch (error) {
        console.error('Error fetching catalog drug:', error);
        res.status(500).json({ error: 'Failed to fetch product details' });
    }
};

export const getDosageForms = async (req: Request, res: Response): Promise<any> => {
    try {
        const [forms] = await db.query<RowDataPacket[]>(`
            SELECT DISTINCT dosage_form 
            FROM drugs 
            WHERE dosage_form IS NOT NULL AND dosage_form != '' AND is_active = 1
            ORDER BY dosage_form ASC
        `);
        res.json(forms.map(f => f.dosage_form));
    } catch (error) {
        console.error('Error fetching dosage forms:', error);
        res.status(500).json({ error: 'Failed to fetch dosage forms' });
    }
};

export const getCatalogCategories = async (req: Request, res: Response): Promise<any> => {
    try {
        const { search } = req.query;

        let query = `
            SELECT c.id, c.name, c.description, COUNT(d.id) AS productCount
            FROM categories c
            LEFT JOIN drugs d ON c.id = d.category_id AND d.is_active = 1
            WHERE c.status = 'active'
        `;
        const params: any[] = [];

        if (search) {
            query += ' AND c.name LIKE ?';
            params.push(`%${search}%`);
        }

        query += ' GROUP BY c.id ORDER BY c.name ASC';

        const [categories] = await db.query<RowDataPacket[]>(query, params);
        res.json(categories);
    } catch (error) {
        console.error('Error fetching catalog categories:', error);
        res.status(500).json({ error: 'Failed to fetch catalog categories' });
    }
};
