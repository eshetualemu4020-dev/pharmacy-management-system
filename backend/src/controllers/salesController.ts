import { Request, Response } from 'express';
import pool from '../config/db.js';
import { calculatePromotionDiscount } from './promotionController.js';
import { logAudit } from '../utils/auditLogger.js';

export const getSales = async (req: Request, res: Response) => {
    try {
        const { search, payment_status, sale_status, date_range, sort, page = '1', limit = '10' } = req.query;
        
        let query = `
            SELECT s.*, 
                   u.username as pharmacist_name,
                   c.name as customer_name
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE 1=1
        `;
        const queryParams: any[] = [];

        if (search) {
            query += ` AND (s.id LIKE ? OR u.username LIKE ? OR c.name LIKE ?)`;
            const searchParam = `%${search}%`;
            queryParams.push(searchParam, searchParam, searchParam);
        }

        if (payment_status) {
            query += ` AND s.payment_status = ?`;
            queryParams.push(payment_status);
        }

        if (sale_status) {
            query += ` AND s.sale_status = ?`;
            queryParams.push(sale_status);
        }

        if (date_range === 'today') {
            query += ` AND DATE(s.created_at) = CURDATE()`;
        } else if (date_range === 'week') {
            query += ` AND YEARWEEK(s.created_at, 1) = YEARWEEK(CURDATE(), 1)`;
        } else if (date_range === 'month') {
            query += ` AND MONTH(s.created_at) = MONTH(CURDATE()) AND YEAR(s.created_at) = YEAR(CURDATE())`;
        }

        if (sort === 'oldest') {
            query += ` ORDER BY s.created_at ASC`;
        } else if (sort === 'highest_amount') {
            query += ` ORDER BY s.total_amount DESC`;
        } else if (sort === 'lowest_amount') {
            query += ` ORDER BY s.total_amount ASC`;
        } else {
            query += ` ORDER BY s.created_at DESC`;
        }

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit as string), offset);

        const [rows] = await pool.query(query, queryParams);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE 1=1
        `;
        const countParams: any[] = [];
        
        if (search) {
            countQuery += ` AND (s.id LIKE ? OR u.username LIKE ? OR c.name LIKE ?)`;
            const searchParam = `%${search}%`;
            countParams.push(searchParam, searchParam, searchParam);
        }
        if (payment_status) {
            countQuery += ` AND s.payment_status = ?`;
            countParams.push(payment_status);
        }
        if (sale_status) {
            countQuery += ` AND s.sale_status = ?`;
            countParams.push(sale_status);
        }
        if (date_range === 'today') {
            countQuery += ` AND DATE(s.created_at) = CURDATE()`;
        } else if (date_range === 'week') {
            countQuery += ` AND YEARWEEK(s.created_at, 1) = YEARWEEK(CURDATE(), 1)`;
        } else if (date_range === 'month') {
            countQuery += ` AND MONTH(s.created_at) = MONTH(CURDATE()) AND YEAR(s.created_at) = YEAR(CURDATE())`;
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
    } catch (error) {
        console.error('Error in getSales:', error);
        res.status(500).json({ message: 'Error fetching sales' });
    }
};

export const getSaleById = async (req: Request, res: Response) => {
    try {
        const saleId = req.params.id;

        const [sales] = await pool.query(`
            SELECT s.*, 
                   u.username as pharmacist_name,
                   c.name as customer_name,
                   c.email as customer_email,
                   c.phone as customer_phone
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ?
        `, [saleId]);

        if ((sales as any[]).length === 0) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        
        const sale = (sales as any)[0];

        const [items] = await pool.query(`
            SELECT si.*, 
                   d.name as drug_name, 
                   d.generic_name,
                   b.batch_number, 
                   b.mfg_date, 
                   b.exp_date
            FROM sale_items si
            LEFT JOIN drugs d ON si.drug_id = d.id
            LEFT JOIN batches b ON si.batch_id = b.id
            WHERE si.sale_id = ?
        `, [saleId]);

        sale.items = items;

        res.json(sale);
    } catch (error) {
        console.error('Error in getSaleById:', error);
        res.status(500).json({ message: 'Error fetching sale details' });
    }
};

export const getSalesSummary = async (req: Request, res: Response) => {
    try {
        // Today's Sales
        const [todayRows] = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
            FROM sales 
            WHERE DATE(created_at) = CURDATE() AND sale_status = 'completed'
        `);
        
        // This Week's Sales
        const [weekRows] = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total 
            FROM sales 
            WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) AND sale_status = 'completed'
        `);
        
        // This Month's Sales
        const [monthRows] = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total 
            FROM sales 
            WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND sale_status = 'completed'
        `);

        // Total Sales & Total Discounts
        const [totalRows] = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total_sales,
                   COALESCE(SUM(discount), 0) as total_discounts,
                   COUNT(*) as total_transactions
            FROM sales
            WHERE sale_status = 'completed'
        `);

        res.json({
            today_sales: (todayRows as any)[0].total,
            today_transactions: (todayRows as any)[0].count,
            week_sales: (weekRows as any)[0].total,
            month_sales: (monthRows as any)[0].total,
            total_sales: (totalRows as any)[0].total_sales,
            total_discounts: (totalRows as any)[0].total_discounts,
            total_transactions: (totalRows as any)[0].total_transactions,
        });
    } catch (error) {
        console.error('Error in getSalesSummary:', error);
        res.status(500).json({ message: 'Error fetching sales summary' });
    }
};

export const refundSale = async (req: Request, res: Response) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const saleId = req.params.id;

        // Check sale status
        const [sales] = await connection.query('SELECT * FROM sales WHERE id = ? FOR UPDATE', [saleId]);
        if ((sales as any[]).length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Sale not found' });
        }

        const sale = (sales as any)[0];
        if (sale.sale_status === 'refunded') {
            await connection.rollback();
            return res.status(400).json({ message: 'Sale is already refunded' });
        }

        // Get sale items
        const [items] = await connection.query('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);

        for (const item of (items as any[])) {
            if (item.batch_id) {
                // Return to batch
                await connection.query('UPDATE batches SET quantity = quantity + ? WHERE id = ?', [item.quantity, item.batch_id]);
                // Return to main drug stock
                await connection.query('UPDATE drugs SET stock = stock + ? WHERE id = ?', [item.quantity, item.drug_id]);

                // Log inventory transaction
                await connection.query(`
                    INSERT INTO inventory_transactions (drug_id, batch_id, transaction_type, quantity, remarks)
                    VALUES (?, ?, 'ADD', ?, ?)
                `, [item.drug_id, item.batch_id, item.quantity, `Refund for Sale #${saleId}`]);
            } else {
                // No batch, just update drug stock
                await connection.query('UPDATE drugs SET stock = stock + ? WHERE id = ?', [item.quantity, item.drug_id]);

                // Log inventory transaction
                await connection.query(`
                    INSERT INTO inventory_transactions (drug_id, batch_id, transaction_type, quantity, remarks)
                    VALUES (?, NULL, 'ADD', ?, ?)
                `, [item.drug_id, item.quantity, `Refund for Sale #${saleId}`]);
            }
        }

        // Update sale status
        await connection.query('UPDATE sales SET sale_status = ?, payment_status = ? WHERE id = ?', ['refunded', 'refunded', saleId]);

        await connection.commit();
        res.json({ message: 'Sale refunded successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error in refundSale:', error);
        res.status(500).json({ message: 'Error refunding sale' });
    } finally {
        connection.release();
    }
};

export const createSale = async (req: Request, res: Response) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { customer_id, items, promotion_id, payment_method = 'cash' } = req.body;
        const user_id = (req as any).user?.id || req.body.user_id;

        if (!items || items.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Sale must have at least one item' });
        }

        let total_items = 0;
        let subtotal = 0;

        // Verify stock and prepare items
        const processedItems = [];

        for (const item of items) {
            const { drug_id, batch_id, quantity, unit_price } = item;
            
            // Validate stock
            const [drugRows] = await connection.query('SELECT stock, name FROM drugs WHERE id = ? FOR UPDATE', [drug_id]);
            if ((drugRows as any[]).length === 0) {
                throw new Error(`Drug with ID ${drug_id} not found`);
            }
            
            const drug = (drugRows as any)[0];
            
            if (drug.requires_prescription && !item.prescription_verified) {
                throw new Error(`Drug ${drug.name} requires a valid prescription, but none was verified.`);
            }

            if (drug.stock < quantity) {
                throw new Error(`Insufficient stock for drug ${drug.name}. Available: ${drug.stock}`);
            }

            if (batch_id) {
                const [batchRows] = await connection.query('SELECT quantity, exp_date FROM batches WHERE id = ? FOR UPDATE', [batch_id]);
                if ((batchRows as any[]).length === 0 || (batchRows as any)[0].quantity < quantity) {
                    throw new Error(`Insufficient stock in batch ${batch_id} for drug ${drug.name}`);
                }
                
                const batchExpDate = new Date((batchRows as any)[0].exp_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (batchExpDate < today) {
                    throw new Error(`Cannot sell: Batch ${batch_id} for drug ${drug.name} has expired.`);
                }
            }

            const itemSubtotal = quantity * unit_price;
            total_items += quantity;
            subtotal += itemSubtotal;
            
            processedItems.push({
                drug_id,
                batch_id,
                quantity,
                unit_price,
                subtotal: itemSubtotal
            });
        }

        let calculated_discount = 0;
        if (promotion_id) {
            const promoResult = await calculatePromotionDiscount(promotion_id, processedItems);
            calculated_discount = promoResult.discount;
        }

        const total_amount = subtotal - calculated_discount;

        // Generate sale number
        const dateSuffix = Date.now().toString().slice(-6);
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const sell_no = `SALE-${new Date().getFullYear()}-${dateSuffix}${randomNum}`;

        // Insert Sale
        const [saleResult] = await connection.query(`
            INSERT INTO sales (sell_no, customer_id, user_id, total_items, subtotal, discount, total_amount, payment_method, payment_status, sale_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'completed')
        `, [sell_no, customer_id || null, user_id, total_items, subtotal, calculated_discount, total_amount, payment_method]);

        const saleId = (saleResult as any).insertId;

        // Insert Sale Items and update inventory
        for (const item of processedItems) {
            await connection.query(`
                INSERT INTO sale_items (sale_id, drug_id, batch_id, quantity, unit_price, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [saleId, item.drug_id, item.batch_id || null, item.quantity, item.unit_price, item.subtotal]);

            // Deduct stock
            await connection.query('UPDATE drugs SET stock = stock - ? WHERE id = ?', [item.quantity, item.drug_id]);
            
            if (item.batch_id) {
                await connection.query('UPDATE batches SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.batch_id]);
            }

            // Log inventory transaction
            await connection.query(`
                INSERT INTO inventory_transactions (drug_id, batch_id, transaction_type, quantity, remarks)
                VALUES (?, ?, 'REMOVE', ?, ?)
            `, [item.drug_id, item.batch_id || null, item.quantity, `Sale #${saleId}`]);
        }

        await connection.commit();

        try {
            await logAudit({
                userId: user_id,
                action: 'SALE_COMPLETED',
                module: 'Sales',
                entityType: 'sales',
                entityId: saleId,
                description: `Sale ${sell_no} completed. Total: ${total_amount}${promotion_id ? ' (Promotion applied)' : ''}`
            });
        } catch (auditError) {
            console.error('Failed to log audit for sale:', auditError);
        }

        res.status(201).json({ message: 'Sale created successfully', saleId, sell_no });
    } catch (error: any) {
        await connection.rollback();
        console.error('Error in createSale:', error);
        res.status(500).json({ message: error.message || 'Error creating sale' });
    } finally {
        connection.release();
    }
};
