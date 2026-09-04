import { Request, Response } from 'express';
import pool from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const { search, status, page, limit, sortField, sortOrder } = req.query;
        
        const isPaginated = page !== undefined;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 15;
        const offset = (pageNum - 1) * limitNum;
        
        let query = `
            SELECT 
                s.*, 
                (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id) as total_orders
            FROM suppliers s
            WHERE 1=1
        `;
        let countQuery = `SELECT COUNT(*) as total FROM suppliers s WHERE 1=1`;
        const queryParams: any[] = [];

        if (search) {
            const searchClause = ` AND (s.name LIKE ? OR s.contact_person LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)`;
            query += searchClause;
            countQuery += searchClause;
            const searchParam = `%${search}%`;
            queryParams.push(searchParam, searchParam, searchParam, searchParam);
        }

        if (status) {
            query += ` AND s.status = ?`;
            countQuery += ` AND s.status = ?`;
            queryParams.push(status);
        }

        // Sorting
        const allowedSortFields = ['name', 'status', 'created_at', 'total_orders'];
        const sort = allowedSortFields.includes(sortField as string) ? sortField : 'id';
        const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
        
        query += ` ORDER BY s.${sort} ${order}`;

        if (isPaginated) {
            query += ` LIMIT ? OFFSET ?`;
            
            const [countRows] = await pool.query<RowDataPacket[]>(countQuery, queryParams);
            const total = countRows[0].total;
            
            const [rows] = await pool.query<RowDataPacket[]>(query, [...queryParams, limitNum, offset]);
            
            res.json({
                data: rows,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum)
            });
        } else {
            const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);
            res.json(rows);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getSupplierById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Get supplier details
        const [supplierRows] = await pool.query<RowDataPacket[]>(
            `SELECT * FROM suppliers WHERE id = ?`,
            [id]
        );

        if (supplierRows.length === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        const supplier = supplierRows[0];

        // Get purchase history for this supplier
        const [ordersRows] = await pool.query<RowDataPacket[]>(
            `SELECT po.*, u.username as created_by_name 
             FROM purchase_orders po 
             JOIN users u ON po.created_by = u.id 
             WHERE po.supplier_id = ? 
             ORDER BY po.created_at DESC`,
            [id]
        );

        // Get batches supplied by this supplier
        const [batchesRows] = await pool.query<RowDataPacket[]>(
            `SELECT b.*, d.name as drug_name, d.generic_name 
             FROM batches b
             JOIN drugs d ON b.drug_id = d.id
             WHERE b.supplier_id = ? 
             ORDER BY b.created_at DESC`,
            [id]
        );

        // Get distinct products supplied by this supplier
        const [productsRows] = await pool.query<RowDataPacket[]>(
            `SELECT DISTINCT d.id, d.name, d.generic_name, d.stock, d.price, d.is_active as status
             FROM drugs d 
             JOIN batches b ON d.id = b.drug_id
             WHERE b.supplier_id = ?`,
            [id]
        );

        res.json({
            ...supplier,
            purchase_orders: ordersRows,
            batches: batchesRows,
            products: productsRows
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createSupplier = async (req: Request, res: Response): Promise<any> => {
    try {
        let { name, contact_person, phone, email, address, city, country, status, notes } = req.body;

        name = name?.trim();
        phone = phone?.trim();
        contact_person = contact_person?.trim() || null;
        email = email?.trim() || null;
        address = address?.trim() || null;
        city = city?.trim() || null;
        country = country?.trim() || null;
        notes = notes?.trim() || null;
        status = status || 'active';

        // Required fields
        if (!name || !phone) {
            return res.status(400).json({ message: 'Company Name and Phone are required.' });
        }
        
        // Status validation
        if (status !== 'active' && status !== 'inactive') {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        // Length validations
        if (name.length < 2 || name.length > 150) return res.status(400).json({ message: 'Company name must be between 2 and 150 characters.' });
        if (contact_person && contact_person.length > 100) return res.status(400).json({ message: 'Contact person must be 100 characters or less.' });
        if (address && address.length > 250) return res.status(400).json({ message: 'Address must be 250 characters or less.' });
        if (city && city.length > 100) return res.status(400).json({ message: 'City must be 100 characters or less.' });
        if (notes && notes.length > 500) return res.status(400).json({ message: 'Notes must be 500 characters or less.' });
        if (email && email.length > 150) return res.status(400).json({ message: 'Email must be 150 characters or less.' });

        // Email validation
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Invalid email address format.' });
            }
        }

        // Check for duplicates
        const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM suppliers WHERE name = ?', [name]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'A supplier with this company name already exists.' });
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO suppliers 
            (name, contact_person, phone, email, address, city, country, status, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, contact_person, phone, email, address, city, country, status, notes]
        );

        res.status(201).json({ 
            id: result.insertId, 
            message: 'Supplier created successfully' 
        });
    } catch (error: any) {
        console.error('Create Supplier Error:', error);
        res.status(500).json({ message: 'Internal server error while creating supplier' });
    }
};

export const updateSupplier = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        let { name, contact_person, phone, email, address, city, country, status, notes } = req.body;

        name = name?.trim();
        phone = phone?.trim();
        contact_person = contact_person?.trim() || null;
        email = email?.trim() || null;
        address = address?.trim() || null;
        city = city?.trim() || null;
        country = country?.trim() || null;
        notes = notes?.trim() || null;

        if (!name || !phone) {
            return res.status(400).json({ message: 'Company Name and Phone are required.' });
        }

        if (status && status !== 'active' && status !== 'inactive') {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        if (name.length < 2 || name.length > 150) return res.status(400).json({ message: 'Company name must be between 2 and 150 characters.' });
        if (contact_person && contact_person.length > 100) return res.status(400).json({ message: 'Contact person must be 100 characters or less.' });
        if (address && address.length > 250) return res.status(400).json({ message: 'Address must be 250 characters or less.' });
        if (city && city.length > 100) return res.status(400).json({ message: 'City must be 100 characters or less.' });
        if (notes && notes.length > 500) return res.status(400).json({ message: 'Notes must be 500 characters or less.' });
        if (email && email.length > 150) return res.status(400).json({ message: 'Email must be 150 characters or less.' });

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Invalid email address format.' });
            }
        }

        // Check for duplicates (excluding self)
        const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM suppliers WHERE name = ? AND id != ?', [name, id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'A supplier with this company name already exists.' });
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE suppliers 
             SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, city = ?, country = ?, status = COALESCE(?, status), notes = ? 
             WHERE id = ?`,
            [name, contact_person, phone, email, address, city, country, status, notes, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        res.json({ message: 'Supplier updated successfully' });
    } catch (error: any) {
        console.error('Update Supplier Error:', error);
        res.status(500).json({ message: 'Internal server error while updating supplier' });
    }
};

export const deleteSupplier = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        
        const [pos] = await pool.query<RowDataPacket[]>('SELECT id FROM purchase_orders WHERE supplier_id = ? LIMIT 1', [id]);
        if (pos.length > 0) {
            return res.status(400).json({ message: 'This supplier cannot be deleted because historical records (Purchase Orders) are associated with it. Deactivate the supplier instead.' });
        }
        
        const [batches] = await pool.query<RowDataPacket[]>('SELECT id FROM batches WHERE supplier_id = ? LIMIT 1', [id]);
        if (batches.length > 0) {
            return res.status(400).json({ message: 'This supplier cannot be deleted because historical records (Batches) are associated with it. Deactivate the supplier instead.' });
        }

        const [result] = await pool.query<ResultSetHeader>('DELETE FROM suppliers WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        
        res.json({ message: 'Supplier deleted successfully' });
    } catch (error: any) {
        console.error('Delete Supplier Error:', error);
        res.status(500).json({ message: 'Internal server error while deleting supplier' });
    }
};

export const updateSupplierStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status !== 'active' && status !== 'inactive') {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE suppliers SET status = ? WHERE id = ?`,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        res.json({ message: `Supplier successfully marked as ${status}` });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
