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
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeItems,
                SUM(price * stock) as totalValue
            FROM drugs
        `);

        const [stockStats] = await db.query<RowDataPacket[]>(`
            SELECT 
                SUM(CASE WHEN available_quantity = 0 THEN 1 ELSE 0 END) as outOfStock,
                SUM(CASE WHEN available_quantity > 0 AND available_quantity <= min_stock_level THEN 1 ELSE 0 END) as lowStock
            FROM (
                SELECT 
                    d.id,
                    d.min_stock_level,
                    COALESCE((SELECT SUM(quantity) FROM batches b WHERE b.drug_id = d.id AND b.exp_date > CURDATE()), 0) AS available_quantity
                FROM drugs d
                WHERE d.is_active = 1
            ) as stock_calc
        `);

        const [expiring] = await db.query<RowDataPacket[]>(`
            SELECT COUNT(DISTINCT drug_id) as expiringSoon
            FROM batches
            WHERE exp_date > CURDATE() AND exp_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
            AND quantity > 0
        `);

        res.json({
            totalItems: drugs[0].totalItems || 0,
            activeItems: drugs[0].activeItems || 0,
            totalValue: drugs[0].totalValue || 0,
            outOfStock: stockStats[0].outOfStock || 0,
            lowStock: stockStats[0].lowStock || 0,
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
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;
        
        const search = req.query.search as string;
        const category = req.query.category as string;
        const status = req.query.status as string;
        const stock_status = req.query.stock_status as string;
        const dosage_form = req.query.dosage_form as string;

        let query = `
            SELECT 
                d.id, d.name, d.generic_name, d.strength, d.dosage_form, d.price, 
                d.stock, d.min_stock_level, d.is_active, d.image_url,
                c.name as category_name,
                COALESCE((SELECT SUM(quantity) FROM batches b WHERE b.drug_id = d.id AND b.exp_date > CURDATE()), 0) AS available_quantity,
                (SELECT COUNT(*) FROM batches b WHERE b.drug_id = d.id AND b.exp_date > CURDATE() AND b.exp_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY) AND b.quantity > 0) AS expiring_batches,
                (SELECT COUNT(*) FROM batches b WHERE b.drug_id = d.id AND b.exp_date <= CURDATE() AND b.quantity > 0) AS expired_batches,
                (SELECT s.name FROM batches b JOIN suppliers s ON b.supplier_id = s.id WHERE b.drug_id = d.id ORDER BY b.received_date DESC LIMIT 1) AS preferred_supplier,
                (SELECT s.id FROM batches b JOIN suppliers s ON b.supplier_id = s.id WHERE b.drug_id = d.id ORDER BY b.received_date DESC LIMIT 1) AS preferred_supplier_id,
                (SELECT COALESCE(SUM(poi.quantity_ordered - poi.quantity_received), 0) FROM purchase_order_items poi JOIN purchase_orders po ON poi.purchase_order_id = po.id WHERE poi.drug_id = d.id AND po.status IN ('ordered', 'partially_received')) AS pending_po_qty
            FROM drugs d
            LEFT JOIN categories c ON d.category_id = c.id
            WHERE 1=1
        `;
        let countQuery = `
            SELECT COUNT(*) as total
            FROM drugs d
            WHERE 1=1
        `;
        
        const params: any[] = [];
        
        if (search) {
            const searchClause = ' AND (d.name LIKE ? OR d.generic_name LIKE ? OR d.id LIKE ?)';
            query += searchClause;
            countQuery += searchClause;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (category) {
            query += ' AND d.category_id = ?';
            countQuery += ' AND d.category_id = ?';
            params.push(category);
        }

        if (status) {
            const isActive = status === 'active' ? 1 : 0;
            query += ' AND d.is_active = ?';
            countQuery += ' AND d.is_active = ?';
            params.push(isActive);
        }

        if (dosage_form) {
            query += ' AND d.dosage_form = ?';
            countQuery += ' AND d.dosage_form = ?';
            params.push(dosage_form);
        }

        if (stock_status === 'in_stock') {
            const clause = ' AND COALESCE((SELECT SUM(quantity) FROM batches b WHERE b.drug_id = d.id AND b.exp_date > CURDATE()), 0) > d.min_stock_level';
            query += clause;
            countQuery += clause;
        } else if (stock_status === 'low_stock') {
            const clause = ' AND COALESCE((SELECT SUM(quantity) FROM batches b WHERE b.drug_id = d.id AND b.exp_date > CURDATE()), 0) > 0 AND COALESCE((SELECT SUM(quantity) FROM batches b WHERE b.drug_id = d.id AND b.exp_date > CURDATE()), 0) <= d.min_stock_level';
            query += clause;
            countQuery += clause;
        } else if (stock_status === 'out_of_stock') {
            const clause = ' AND COALESCE((SELECT SUM(quantity) FROM batches b WHERE b.drug_id = d.id AND b.exp_date > CURDATE()), 0) = 0';
            query += clause;
            countQuery += clause;
        } else if (stock_status === 'replenishment') {
            const clause = ' AND COALESCE((SELECT SUM(quantity) FROM batches b WHERE b.drug_id = d.id AND b.exp_date > CURDATE()), 0) <= d.min_stock_level';
            query += clause;
            countQuery += clause;
        }

        query += ' ORDER BY d.name ASC LIMIT ? OFFSET ?';
        
        const [totalResult] = await db.query<RowDataPacket[]>(countQuery, params);
        const total = totalResult[0].total;

        const dataParams = [...params, limit, offset];
        const [drugs] = await db.query<RowDataPacket[]>(query, dataParams);
        
        res.json({
            data: drugs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
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
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;
        
        const search = req.query.search as string;
        const supplier = req.query.supplier as string;
        const status = req.query.status as string;

        let query = `
            SELECT b.*, 
                   d.name as drug_name, 
                   d.generic_name, 
                   d.min_stock_level,
                   s.name as supplier_name,
                   po.po_number
            FROM batches b
            JOIN drugs d ON b.drug_id = d.id
            LEFT JOIN suppliers s ON b.supplier_id = s.id
            LEFT JOIN purchase_orders po ON b.purchase_order_id = po.id
            WHERE d.is_active = 1
        `;
        
        let countQuery = `
            SELECT COUNT(*) as total
            FROM batches b
            JOIN drugs d ON b.drug_id = d.id
            LEFT JOIN suppliers s ON b.supplier_id = s.id
            WHERE d.is_active = 1
        `;

        const params: any[] = [];

        if (search) {
            const searchClause = ' AND (d.name LIKE ? OR d.generic_name LIKE ? OR b.batch_number LIKE ?)';
            query += searchClause;
            countQuery += searchClause;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (supplier) {
            query += ' AND b.supplier_id = ?';
            countQuery += ' AND b.supplier_id = ?';
            params.push(supplier);
        }

        if (status) {
            if (status === 'available') {
                const clause = ' AND b.quantity > 0 AND (b.exp_date > CURDATE() OR b.exp_date IS NULL)';
                query += clause;
                countQuery += clause;
            } else if (status === 'depleted') {
                const clause = ' AND b.quantity = 0';
                query += clause;
                countQuery += clause;
            } else if (status === 'expired') {
                const clause = ' AND b.exp_date < CURDATE()';
                query += clause;
                countQuery += clause;
            }
        }

        const expiry_period = req.query.expiry_period as string;
        if (expiry_period) {
            const periodInt = parseInt(expiry_period);
            if (!isNaN(periodInt)) {
                const clause = ' AND b.quantity > 0 AND b.exp_date > CURDATE() AND b.exp_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)';
                query += clause;
                countQuery += clause;
                params.push(periodInt);
            }
        }

        const expired_duration = req.query.expired_duration as string;
        if (expired_duration) {
            const periodInt = parseInt(expired_duration);
            if (!isNaN(periodInt)) {
                const clause = ' AND b.exp_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
                query += clause;
                countQuery += clause;
                params.push(periodInt);
            }
        }

        query += ' ORDER BY b.exp_date ASC LIMIT ? OFFSET ?';

        const [totalResult] = await db.query<RowDataPacket[]>(countQuery, params);
        const total = totalResult[0].total;

        const dataParams = [...params, limit, offset];
        const [batches] = await db.query<RowDataPacket[]>(query, dataParams);
        
        res.json({
            data: batches,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
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
        
        const [adjustmentResult] = await connection.query<ResultSetHeader>(
            'INSERT INTO stock_adjustments (drug_id, batch_id, adjustment_qty, reason, notes, adjusted_by) VALUES (?, ?, ?, ?, ?, ?)',
            [drug_id, batchId, actualChange, transaction_type, remarks || '', (req as any).user?.id || 1]
        );
        const adjustmentId = adjustmentResult.insertId;

        await connection.query(
            `INSERT INTO stock_movements (drug_id, batch_id, change_qty, reason, reference_table, reference_id, created_by)
             VALUES (?, ?, ?, 'adjustment', 'stock_adjustments', ?, ?)`,
            [drug_id, batchId, actualChange, adjustmentId, (req as any).user?.id || 1]
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
