import { Request, Response } from 'express';
import pool from '../config/db.js';
import { Connection } from 'mysql2/promise';

// Helper function to create notifications transactionally
export const createNotification = async (
    connection: Connection,
    customerId: number,
    type: 'ORDER' | 'PRESCRIPTION' | 'PAYMENT' | 'PROMOTION' | 'ACCOUNT' | 'SYSTEM',
    title: string,
    message: string,
    relatedId: number | null = null
): Promise<void> => {
    try {
        await connection.query(`
            INSERT INTO customer_notifications (customer_id, type, title, message, related_id)
            VALUES (?, ?, ?, ?, ?)
        `, [customerId, type, title, message, relatedId]);
    } catch (error) {
        console.error('Failed to create customer notification:', error);
        // We do not re-throw here so a failing notification doesn't break the main transaction
        // unless strictly required. However, within a transaction it's usually better to just log.
    }
};

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        const { type, is_read, page = '1', limit = '10' } = req.query;

        let query = `
            SELECT id, type, title, message, related_id, is_read, created_at 
            FROM customer_notifications 
            WHERE customer_id = ?
        `;
        const queryParams: any[] = [customerId];

        if (type && type !== 'All') {
            query += ` AND type = ?`;
            queryParams.push(type);
        }

        if (is_read === 'false') {
            query += ` AND is_read = FALSE`;
        } else if (is_read === 'true') {
            query += ` AND is_read = TRUE`;
        }

        query += ` ORDER BY created_at DESC`;

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit as string), offset);

        const [rows] = await pool.query(query, queryParams);

        let countQuery = `SELECT COUNT(id) as total FROM customer_notifications WHERE customer_id = ?`;
        const countParams: any[] = [customerId];
        
        if (type && type !== 'All') {
            countQuery += ` AND type = ?`;
            countParams.push(type);
        }
        if (is_read === 'false') {
            countQuery += ` AND is_read = FALSE`;
        } else if (is_read === 'true') {
            countQuery += ` AND is_read = TRUE`;
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
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Unable to load notifications' });
    }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        const [rows] = await pool.query(`
            SELECT COUNT(id) as unread_count 
            FROM customer_notifications 
            WHERE customer_id = ? AND is_read = FALSE
        `, [customerId]);

        const count = (rows as any)[0].unread_count;
        res.json({ unread_count: count });
    } catch (error: any) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Unable to load unread count' });
    }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;
        const { id } = req.params;

        const [result] = await pool.query(`
            UPDATE customer_notifications 
            SET is_read = TRUE 
            WHERE id = ? AND customer_id = ?
        `, [id, customerId]);

        if ((result as any).affectedRows === 0) {
            res.status(404).json({ error: 'Notification not found or already read' });
            return;
        }

        res.json({ message: 'Notification marked as read' });
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Unable to update notification' });
    }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const customerId = (req as any).user.id;

        await pool.query(`
            UPDATE customer_notifications 
            SET is_read = TRUE 
            WHERE customer_id = ? AND is_read = FALSE
        `, [customerId]);

        res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ error: 'Unable to update notifications' });
    }
};
