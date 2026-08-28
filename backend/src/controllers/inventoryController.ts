import { Request, Response } from 'express';
import db from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { logAudit } from '../utils/auditLogger.js';

// GET /api/inventory/summary
export const getInventorySummary = async (req: Request, res: Response): Promise<any> => {
    try {
        const [drugs] = await db.query<RowDataPacket[]>(`
            SELECT 
                COUNT(*) as totalItems,
                SUM(price * stock) as totalValue,
                SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as outOfStock,
                SUM(CASE WHEN stock > 0 AND stock <= min_stock_level THEN 1 ELSE 0 END) as lowStock
            FROM drugs
            WHERE is_active = 1
        `);

        const [expiring] = await db.query<RowDataPacket[]>(`
            SELECT COUNT(DISTINCT drug_id) as expiringSoon
            FROM batches
            WHERE exp_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
            AND quantity > 0
        `);

        res.json({
            ...drugs[0],
            expiringSoon: expiring[0].expiringSoon || 0
        });
    } catch (error) {
        console.error('Error fetching inventory summary:', error);
        res.status(500).json({ error: 'Failed to fetch inventory summary' });
    }
};

// GET /api/inventory
export const getInventoryList = async (req: Request, res: Response): Promise<any> => {
    try {
        const [drugs] = await db.query<RowDataPacket[]>(`
            SELECT 
                d.id, d.name, d.generic_name, d.price, d.stock, d.min_stock_level, d.image_url,
                c.name as category_name
            FROM drugs d
            LEFT JOIN categories c ON d.category_id = c.id
            WHERE d.is_active = 1
            ORDER BY d.name ASC
        `);
        res.json(drugs);
    } catch (error) {
        console.error('Error fetching inventory list:', error);
        res.status(500).json({ error: 'Failed to fetch inventory list' });
    }
};

// GET /api/inventory/:drugId/batches
export const getDrugBatches = async (req: Request, res: Response): Promise<any> => {
    try {
        const { drugId } = req.params;
        const [batches] = await db.query<RowDataPacket[]>(`
            SELECT * FROM batches
            WHERE drug_id = ?
            ORDER BY exp_date ASC
        `, [drugId]);
        res.json(batches);
    } catch (error) {
        console.error('Error fetching batches:', error);
        res.status(500).json({ error: 'Failed to fetch batches' });
    }
};

// GET /api/inventory/batches/all
export const getAllBatches = async (req: Request, res: Response): Promise<any> => {
    try {
        const [batches] = await db.query<RowDataPacket[]>(`
            SELECT b.*, d.name as drug_name, d.min_stock_level
            FROM batches b
            JOIN drugs d ON b.drug_id = d.id
            WHERE d.is_active = 1
            ORDER BY b.exp_date ASC
        `);
        res.json(batches);
    } catch (error) {
        console.error('Error fetching all batches:', error);
        res.status(500).json({ error: 'Failed to fetch all batches' });
    }
};

// POST /api/inventory/adjust
export const adjustStock = async (req: Request, res: Response): Promise<any> => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { drug_id, batch_number, mfg_date, exp_date, transaction_type, quantity, remarks } = req.body;
        
        if (!drug_id || !batch_number || !transaction_type || quantity === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const qtyInt = parseInt(quantity, 10);
        if (qtyInt <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than 0' });
        }

        // 1. Find or create the batch
        let batchId;
        const [batches] = await connection.query<RowDataPacket[]>('SELECT * FROM batches WHERE drug_id = ? AND batch_number = ?', [drug_id, batch_number]);
        
        if (batches.length > 0) {
            batchId = batches[0].id;
            // Update existing batch quantity
            let newBatchQty = batches[0].quantity;
            if (transaction_type === 'ADD') {
                newBatchQty += qtyInt;
            } else if (transaction_type === 'REMOVE') {
                newBatchQty -= qtyInt;
                if (newBatchQty < 0) throw new Error('Insufficient stock in batch');
            }
            
            await connection.query('UPDATE batches SET quantity = ? WHERE id = ?', [newBatchQty, batchId]);
        } else {
            if (transaction_type === 'REMOVE') {
                throw new Error('Cannot remove stock from a non-existent batch');
            }
            if (!mfg_date || !exp_date) {
                throw new Error('Manufacturing and Expiry dates required for a new batch');
            }
            // Create new batch
            const [result] = await connection.query<ResultSetHeader>(
                'INSERT INTO batches (drug_id, batch_number, quantity, mfg_date, exp_date) VALUES (?, ?, ?, ?, ?)',
                [drug_id, batch_number, qtyInt, mfg_date, exp_date]
            );
            batchId = result.insertId;
        }

        // 2. Create transaction record
        let actualChange = transaction_type === 'REMOVE' ? -qtyInt : qtyInt;
        await connection.query(
            'INSERT INTO inventory_transactions (drug_id, batch_id, transaction_type, quantity, remarks) VALUES (?, ?, ?, ?, ?)',
            [drug_id, batchId, transaction_type, actualChange, remarks || '']
        );

        // 3. Update overall drug stock
        const [totalRows] = await connection.query<RowDataPacket[]>('SELECT SUM(quantity) as total FROM batches WHERE drug_id = ?', [drug_id]);
        const newTotalStock = totalRows[0].total || 0;
        await connection.query('UPDATE drugs SET stock = ? WHERE id = ?', [newTotalStock, drug_id]);

        await connection.commit();
        res.json({ message: 'Stock adjusted successfully', newTotalStock });

        if (req.user && req.user.id) {
            logAudit({
                userId: req.user.id,
                action: 'STOCK_ADJUSTMENT',
                module: 'Inventory',
                entityType: 'drugs',
                entityId: parseInt(drug_id),
                description: `Stock ${transaction_type} of ${actualChange} for batch ${batch_number}`,
                oldValue: { stock: newTotalStock - actualChange },
                newValue: { stock: newTotalStock }
            });
        }
    } catch (error: any) {
        await connection.rollback();
        console.error('Error adjusting stock:', error);
        res.status(500).json({ error: error.message || 'Failed to adjust stock' });
    } finally {
        connection.release();
    }
};

// GET /api/inventory/transactions
export const getTransactionHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        const [transactions] = await db.query<RowDataPacket[]>(`
            SELECT 
                t.*,
                d.name as drug_name,
                b.batch_number
            FROM inventory_transactions t
            JOIN drugs d ON t.drug_id = d.id
            LEFT JOIN batches b ON t.batch_id = b.id
            ORDER BY t.created_at DESC
            LIMIT 100
        `);
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
};
