import { Request, Response } from 'express';
import pool from '../config/db.js';

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const { search, sort, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 10;
        const offset = (pageNum - 1) * limitNum;

        let query = 'SELECT id, name, email, phone, created_at FROM customers WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
        const queryParams: any[] = [];

        if (search) {
            const searchClause = ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR id = ?)';
            query += searchClause;
            countQuery += searchClause;
            const searchParam = `%${search}%`;
            queryParams.push(searchParam, searchParam, searchParam, search);
        }

        if (sort === 'oldest') {
            query += ' ORDER BY created_at ASC LIMIT ? OFFSET ?';
        } else {
            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        }
        
        const [countResult] = await pool.query(countQuery, queryParams);
        const total = (countResult as any)[0].total;

        const [rows] = await pool.query(query, [...queryParams, limitNum, offset]);
        
        res.json({
            data: rows,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Error fetching customers' });
    }
};

export const getCustomerStats = async (req: Request, res: Response) => {
    try {
        const [totalCustomers]: any = await pool.query(`SELECT COUNT(*) as count FROM customers`);
        const [newCustomers]: any = await pool.query(`SELECT COUNT(*) as count FROM customers WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`);
        const [activeCustomers]: any = await pool.query(`SELECT COUNT(DISTINCT customer_id) as count FROM orders`);

        res.json({
            total_customers: totalCustomers[0].count,
            new_customers: newCustomers[0].count,
            active_customers: activeCustomers[0].count
        });
    } catch (error) {
        console.error('Error fetching customer stats:', error);
        res.status(500).json({ message: 'Error fetching customer stats' });
    }
};

export const getCustomerById = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.params.id;
        
        const [customerRows] = await pool.query('SELECT id, name, email, phone, address, created_at FROM customers WHERE id = ?', [customerId]);
        const customers = customerRows as any[];

        if (customers.length === 0) {
            return res.status(404).json({ error: 'Customer not found.' });
        }
        const customer = customers[0];

        // Stats
        const [orderStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'completed' OR status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
                SUM(CASE WHEN status = 'pending_prescription' OR status = 'placed' OR status = 'confirmed' OR status = 'packed' OR status = 'shipped' THEN 1 ELSE 0 END) as pending_orders,
                MAX(created_at) as last_order_date
            FROM orders WHERE customer_id = ?
        `, [customerId]);
        
        const [rxStats] = await pool.query(`
            SELECT COUNT(*) as total_prescriptions
            FROM prescriptions p
            JOIN orders o ON p.order_id = o.id
            WHERE o.customer_id = ?
        `, [customerId]);

        const stats = (orderStats as any)[0];
        const rxCount = (rxStats as any)[0].total_prescriptions;

        res.json({
            ...customer,
            stats: {
                total_orders: stats.total_orders || 0,
                completed_orders: stats.completed_orders || 0,
                pending_orders: stats.pending_orders || 0,
                last_order_date: stats.last_order_date,
                total_prescriptions: rxCount || 0
            }
        });
    } catch (error) {
        console.error('Error fetching customer details:', error);
        res.status(500).json({ error: 'Unable to load customer information. Please try again.' });
    }
};

export const getCustomerOrders = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.params.id;
        const { page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 10;
        const offset = (pageNum - 1) * limitNum;

        // Check customer exists
        const [customerRows] = await pool.query('SELECT id FROM customers WHERE id = ?', [customerId]);
        if ((customerRows as any[]).length === 0) {
            return res.status(404).json({ error: 'Customer not found.' });
        }

        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM orders WHERE customer_id = ?', [customerId]);
        const total = (countResult as any)[0].total;

        const [rows] = await pool.query(`
            SELECT id, status, total_amount, created_at
            FROM orders 
            WHERE customer_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [customerId, limitNum, offset]);

        res.json({
            data: rows,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({ error: 'Unable to load customer information. Please try again.' });
    }
};

export const getCustomerSales = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.params.id;
        const { page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 10;
        const offset = (pageNum - 1) * limitNum;

        const [customerRows] = await pool.query('SELECT id FROM customers WHERE id = ?', [customerId]);
        if ((customerRows as any[]).length === 0) {
            return res.status(404).json({ error: 'Customer not found.' });
        }

        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM sales WHERE customer_id = ?', [customerId]);
        const total = (countResult as any)[0].total;

        const [rows] = await pool.query(`
            SELECT id, sell_no, total_items, total_amount, payment_method, payment_status, sale_status, created_at
            FROM sales 
            WHERE customer_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [customerId, limitNum, offset]);

        res.json({
            data: rows,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching customer sales:', error);
        res.status(500).json({ error: 'Unable to load customer information. Please try again.' });
    }
};

export const getCustomerPrescriptions = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.params.id;
        const { page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 10;
        const offset = (pageNum - 1) * limitNum;

        const [customerRows] = await pool.query('SELECT id FROM customers WHERE id = ?', [customerId]);
        if ((customerRows as any[]).length === 0) {
            return res.status(404).json({ error: 'Customer not found.' });
        }

        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM prescriptions p
            JOIN orders o ON p.order_id = o.id
            WHERE o.customer_id = ?
        `, [customerId]);
        const total = (countResult as any)[0].total;

        const [rows] = await pool.query(`
            SELECT p.id, p.order_id, p.status, p.created_at, u.username as pharmacist_name
            FROM prescriptions p
            JOIN orders o ON p.order_id = o.id
            LEFT JOIN users u ON p.reviewed_by = u.id
            WHERE o.customer_id = ?
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [customerId, limitNum, offset]);

        res.json({
            data: rows,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching customer prescriptions:', error);
        res.status(500).json({ error: 'Unable to load customer information. Please try again.' });
    }
};
