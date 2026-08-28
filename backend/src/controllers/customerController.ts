import { Request, Response } from 'express';
import pool from '../config/db.js';

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        let query = 'SELECT id, name, email, phone FROM customers WHERE 1=1';
        const queryParams: any[] = [];

        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
            const searchParam = `%${search}%`;
            queryParams.push(searchParam, searchParam, searchParam);
        }

        query += ' ORDER BY name ASC LIMIT 50';

        const [rows] = await pool.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Error fetching customers' });
    }
};
