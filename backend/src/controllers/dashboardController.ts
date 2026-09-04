import { Request, Response } from 'express';
import db from '../config/db.js';
import { RowDataPacket } from 'mysql2';

const getSettingValue = async (key: string, defaultValue: number): Promise<number> => {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
    if (rows.length > 0 && rows[0].setting_value) {
        return parseInt(rows[0].setting_value, 10);
    }
    return defaultValue;
};

export const getAdminStats = async (req: Request, res: Response): Promise<any> => {
    try {
        const [userRows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');
        const [categoryRows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM categories');
        const [drugRows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM drugs WHERE is_active = 1');
        
        const lowStockThreshold = await getSettingValue('low_stock_threshold', 10);
        const expiryDays = await getSettingValue('expiry_warning_days', 30);

        const [lowStockRows] = await db.execute<RowDataPacket[]>(
            'SELECT COUNT(*) as count FROM drugs WHERE stock <= ? AND is_active = 1', 
            [lowStockThreshold]
        );

        const [expiringRows] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(DISTINCT d.id) as count FROM drugs d
             JOIN batches b ON d.id = b.drug_id
             WHERE b.exp_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY) 
             AND b.exp_date >= CURDATE() AND d.is_active = 1`,
            [expiryDays]
        );

        const [expiredRows] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(DISTINCT d.id) as count FROM drugs d 
             JOIN batches b ON d.id = b.drug_id 
             WHERE b.exp_date < CURDATE() AND d.is_active = 1`
        );

        res.json({
            users: userRows[0].count,
            categories: categoryRows[0].count,
            drugs: drugRows[0].count,
            lowStock: lowStockRows[0].count,
            expiring: expiringRows[0].count,
            expired: expiredRows[0].count
        });
    } catch (error: any) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
};

export const getPharmacistStats = async (req: Request, res: Response): Promise<any> => {
    try {
        const [pendingRxRows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM prescriptions WHERE status = "pending"');
        
        const lowStockThreshold = await getSettingValue('low_stock_threshold', 10);
        const [lowStockRows] = await db.execute<RowDataPacket[]>(
            'SELECT COUNT(*) as count FROM drugs WHERE stock <= ? AND is_active = 1', 
            [lowStockThreshold]
        );

        const expiryDays = await getSettingValue('expiry_warning_days', 30);
        const [expiringRows] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(DISTINCT d.id) as count FROM drugs d
             JOIN batches b ON d.id = b.drug_id
             WHERE b.exp_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY) 
             AND b.exp_date >= CURDATE() AND d.is_active = 1`,
            [expiryDays]
        );

        // Fetch recently verified prescriptions
        const [recentVerified] = await db.execute<RowDataPacket[]>(
            `SELECT p.id as prescription_id, p.status, p.order_id, c.name as customer_name,
             (SELECT GROUP_CONCAT(d.name SEPARATOR ", ") 
              FROM order_items oi 
              JOIN drugs d ON oi.drug_id = d.id 
              WHERE oi.order_id = p.order_id) as drug_names
             FROM prescriptions p
             JOIN orders o ON p.order_id = o.id
             JOIN customers c ON o.customer_id = c.id
             WHERE p.status = 'approved' OR p.status = 'rejected'
             ORDER BY p.updated_at DESC
             LIMIT 5`
        );

        res.json({
            pendingPrescriptions: pendingRxRows[0].count,
            lowStock: lowStockRows[0].count,
            expiring: expiringRows[0].count,
            recentVerified: recentVerified
        });
    } catch (error: any) {
        console.error('Error fetching pharmacist dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch pharmacist stats' });
    }
};
