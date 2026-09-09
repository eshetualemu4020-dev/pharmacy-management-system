import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2';
import { logAudit } from '../utils/auditLogger.js';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        let [rows] = await db.query<RowDataPacket[]>('SELECT id, username, email, password_hash, role FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            const [customerRows] = await db.query<RowDataPacket[]>('SELECT id, name as username, email, password_hash, "customer" as role FROM customers WHERE email = ?', [email]);
            rows = customerRows;
        }

        const user = rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        logAudit({
            userId: user.id,
            action: 'LOGIN',
            module: 'Auth',
            description: 'User logged in successfully'
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Check if user exists
        const [existing] = await db.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email is already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Accept role from frontend if valid, otherwise default to 'customer'
        const validRoles = ['customer', 'admin', 'pharmacist', 'staff'];
        const userRole = validRoles.includes(role) ? role : 'customer';

        if (userRole === 'customer') {
            await db.query(
                'INSERT INTO customers (name, email, password_hash) VALUES (?, ?, ?)',
                [name, email, hashedPassword]
            );
        } else {
            const dbRole = userRole;
            await db.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, dbRole]
            );
        }
        res.status(201).json({ message: 'User created successfully' });
    } catch (error: any) {
        next(error);
    }
};

export const registerStaff = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    // Only used for initial setup or by admin later.
    const { username, email, password, role } = req.body;

    if (!username || !password || !role || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role]
        );
        res.status(201).json({ message: 'Staff user created successfully' });
    } catch (error) {
        next(error);
    }
};
