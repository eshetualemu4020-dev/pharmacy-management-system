import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { RowDataPacket } from 'mysql2';
import { logAudit } from '../utils/auditLogger.js';

export const getUsers = async (req: Request, res: Response): Promise<any> => {
    try {
        const { search, role, status } = req.query;

        let query = 'SELECT id, username, email, phone, role, status, created_at FROM users WHERE 1=1';
        const params: any[] = [];

        if (search) {
            query += ' AND (username LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const [users] = await db.query<RowDataPacket[]>(query, params);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const getUserById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const [users] = await db.query<RowDataPacket[]>('SELECT id, username, email, phone, role, status, created_at FROM users WHERE id = ?', [id]);
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(users[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

export const createUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const { username, email, password, role, phone, status } = req.body;

        if (!username || !email || !password || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check for existing email or username
        const [existing] = await db.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email or username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result]: any = await db.query(
            'INSERT INTO users (username, email, password_hash, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, role, phone || null, status || 'active']
        );

        res.status(201).json({ 
            message: 'User created successfully',
            userId: result.insertId
        });

        if (req.user && req.user.id) {
            logAudit({
                userId: req.user.id,
                action: 'CREATE',
                module: 'Users',
                entityType: 'users',
                entityId: result.insertId,
                description: `Created user ${username} with role ${role}`,
                newValue: { username, email, role, phone, status: status || 'active' }
            });
        }
    } catch (error: any) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

export const updateUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { username, email, role, phone, status } = req.body;

        const [existing] = await db.query<RowDataPacket[]>('SELECT id FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        await db.query(
            'UPDATE users SET username = ?, email = ?, role = ?, phone = ?, status = ? WHERE id = ?',
            [username, email, role, phone || null, status || 'active', id]
        );

        if (req.user && req.user.id) {
            let actionType = 'UPDATE';
            if (existing[0].role && existing[0].role !== role) {
                actionType = 'ROLE_CHANGE';
            }
            logAudit({
                userId: req.user.id,
                action: actionType,
                module: 'Users',
                entityType: 'users',
                entityId: parseInt(id),
                description: `Updated user ${username}`,
                oldValue: existing[0],
                newValue: { username, email, role, phone, status: status || 'active' }
            });
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

export const updateStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status !== 'active' && status !== 'inactive') {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const [result]: any = await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (req.user && req.user.id) {
            logAudit({
                userId: req.user.id,
                action: status === 'active' ? 'ACTIVATE' : 'DEACTIVATE',
                module: 'Users',
                entityType: 'users',
                entityId: parseInt(id),
                description: `Changed user status to ${status}`,
                newValue: { status }
            });
        }

        res.json({ message: 'User status updated successfully' });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ error: 'New password is required' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const [result]: any = await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (req.user && req.user.id) {
            logAudit({
                userId: req.user.id,
                action: 'PASSWORD_RESET',
                module: 'Users',
                entityType: 'users',
                entityId: parseInt(id),
                description: `Reset password for user #${id}`
            });
        }

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

export const getProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const [users] = await db.query<RowDataPacket[]>('SELECT id, username, email, phone, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(users[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

export const updateProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { username, phone } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const [existing] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        await db.query(
            'UPDATE users SET username = ?, phone = ? WHERE id = ?',
            [username, phone || null, req.user.id]
        );

        logAudit({
            userId: req.user.id,
            action: 'UPDATE',
            module: 'Profile',
            entityType: 'users',
            entityId: req.user.id,
            description: `User updated their own profile`,
            oldValue: { username: existing[0].username, phone: existing[0].phone },
            newValue: { username, phone }
        });

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

export const changePassword = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        const [users] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, req.user.id]);

        logAudit({
            userId: req.user.id,
            action: 'PASSWORD_CHANGE',
            module: 'Profile',
            entityType: 'users',
            entityId: req.user.id,
            description: `User changed their password`
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};
