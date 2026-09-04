import { Request, Response } from 'express';
import db from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export const getCategories = async (req: Request, res: Response): Promise<any> => {
    try {
        const { search, status, page, limit, sortField, sortOrder } = req.query;

        let query = `
            SELECT c.id, c.name, c.description, c.status, c.created_at, COUNT(d.id) AS drugCount
            FROM categories c
            LEFT JOIN drugs d ON c.id = d.category_id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (search) {
            query += ' AND c.name LIKE ?';
            params.push(`%${search}%`);
        }
        if (status && status !== 'all') {
            query += ' AND c.status = ?';
            params.push(status);
        }

        query += ' GROUP BY c.id';

        // Sorting
        const validSortFields = ['name', 'created_at', 'status', 'drugCount'];
        const sort = validSortFields.includes(sortField as string) ? sortField : 'created_at';
        const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sort} ${order}`;

        // If pagination is requested, return paginated structure
        if (page && limit) {
            const pageNum = parseInt(page as string) || 1;
            const limitNum = parseInt(limit as string) || 10;
            const offset = (pageNum - 1) * limitNum;

            // Get total count for pagination (need a wrapper query because of GROUP BY)
            const countQuery = `SELECT COUNT(*) as total FROM (${query}) AS subquery`;
            const [countResult] = await db.query<RowDataPacket[]>(countQuery, params);
            const total = countResult[0].total;

            query += ' LIMIT ? OFFSET ?';
            params.push(limitNum, offset);

            const [categories] = await db.query<RowDataPacket[]>(query, params);

            return res.json({
                data: categories,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum)
            });
        } else {
            // Backward compatibility: return array
            const [categories] = await db.query<RowDataPacket[]>(query, params);
            return res.json(categories);
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

export const getCategoryById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const [categories] = await db.query<RowDataPacket[]>(
            `SELECT c.id, c.name, c.description, c.status, c.created_at, COUNT(d.id) AS drugCount 
             FROM categories c 
             LEFT JOIN drugs d ON c.id = d.category_id 
             WHERE c.id = ? GROUP BY c.id`, 
            [id]
        );
        
        if (categories.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        // Also fetch assigned drugs
        const [drugs] = await db.query<RowDataPacket[]>(
            'SELECT id, name, generic_name, stock as qty, price, is_active as drug_status FROM drugs WHERE category_id = ?',
            [id]
        );

        res.json({ ...categories[0], drugs });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
};

export const createCategory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, description, status } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const [existing] = await db.query<RowDataPacket[]>('SELECT id FROM categories WHERE name = ?', [name]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Category name already exists' });
        }

        const [result]: any = await db.query(
            'INSERT INTO categories (name, description, status) VALUES (?, ?, ?)',
            [name, description || null, status || 'active']
        );

        res.status(201).json({ 
            message: 'Category created successfully',
            categoryId: result.insertId
        });
    } catch (error: any) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
};

export const updateCategory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        // Check if name is taken by ANOTHER category
        const [existing] = await db.query<RowDataPacket[]>('SELECT id FROM categories WHERE name = ? AND id != ?', [name, id]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Category name already exists' });
        }

        const [result]: any = await db.query(
            'UPDATE categories SET name = ?, description = ?, status = ? WHERE id = ?',
            [name, description || null, status || 'active', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
};

export const updateCategoryStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status !== 'active' && status !== 'inactive') {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const [result]: any = await db.query('UPDATE categories SET status = ? WHERE id = ?', [status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category status updated successfully' });
    } catch (error) {
        console.error('Error updating category status:', error);
        res.status(500).json({ error: 'Failed to update category status' });
    }
};

export const deleteCategory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Check if category is used by drugs
        const [drugs] = await db.query<RowDataPacket[]>('SELECT id FROM drugs WHERE category_id = ? LIMIT 1', [id]);
        
        if (drugs.length > 0) {
            return res.status(409).json({ 
                error: 'CATEGORY_IN_USE',
                message: 'This category is currently assigned to one or more drugs and cannot be deleted. You can deactivate it instead.' 
            });
        }

        const [result]: any = await db.query('DELETE FROM categories WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
};
