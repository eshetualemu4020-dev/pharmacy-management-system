import { Request, Response } from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

// Get Current Customer Profile
export const getProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const [rows] = await pool.query('SELECT id, name, email, phone, address, created_at FROM customers WHERE id = ?', [customerId]);
        const customers = rows as any[];

        if (customers.length === 0) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        res.json(customers[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Unable to load profile.' });
    }
};

// Update Customer Profile
export const updateProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const { name, email, phone } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required.' });
        }

        // Check for duplicate email
        const [existing] = await pool.query('SELECT id FROM customers WHERE email = ? AND id != ?', [email, customerId]);
        if ((existing as any[]).length > 0) {
            return res.status(409).json({ error: 'Email is already in use by another account.' });
        }

        await pool.query(
            'UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?',
            [name, email, phone || null, customerId]
        );

        // Fetch updated profile
        const [rows] = await pool.query('SELECT id, name, email, phone, address, created_at FROM customers WHERE id = ?', [customerId]);
        res.json((rows as any[])[0]);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Unable to update profile.' });
    }
};

// Change Password
export const changePassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required.' });
        }

        const [rows] = await pool.query('SELECT password_hash FROM customers WHERE id = ?', [customerId]);
        const customers = rows as any[];

        if (customers.length === 0) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        const customer = customers[0];
        const isMatch = await bcrypt.compare(currentPassword, customer.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE customers SET password_hash = ? WHERE id = ?', [hashedPassword, customerId]);

        res.json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Unable to change password.' });
    }
};

// Get Addresses
export const getAddresses = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const [rows] = await pool.query('SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC', [customerId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ error: 'Unable to load addresses.' });
    }
};

// Add Address
export const addAddress = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const { label, region, city, sub_city, street, details, phone, is_default } = req.body;

        if (!label || !city || !street) {
            return res.status(400).json({ error: 'Label, city, and street are required.' });
        }

        // If setting as default, unset others first
        if (is_default) {
            await pool.query('UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = ?', [customerId]);
        } else {
            // Check if this is the first address, if so make it default
            const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM customer_addresses WHERE customer_id = ?', [customerId]);
            if ((countRows as any[])[0].cnt === 0) {
                req.body.is_default = true;
            }
        }

        const defaultVal = is_default || req.body.is_default ? true : false;

        const [result] = await pool.query(
            'INSERT INTO customer_addresses (customer_id, label, region, city, sub_city, street, details, phone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [customerId, label, region || null, city, sub_city || null, street, details || null, phone || null, defaultVal]
        );

        const [newRow] = await pool.query('SELECT * FROM customer_addresses WHERE id = ?', [(result as any).insertId]);
        res.status(201).json((newRow as any[])[0]);
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ error: 'Unable to add address.' });
    }
};

// Update Address
export const updateAddress = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const addressId = req.params.id;
        const { label, region, city, sub_city, street, details, phone } = req.body;

        if (!label || !city || !street) {
            return res.status(400).json({ error: 'Label, city, and street are required.' });
        }

        // Ensure ownership
        const [existing] = await pool.query('SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?', [addressId, customerId]);
        if ((existing as any[]).length === 0) {
            return res.status(404).json({ error: 'Address not found or unauthorized.' });
        }

        await pool.query(
            'UPDATE customer_addresses SET label = ?, region = ?, city = ?, sub_city = ?, street = ?, details = ?, phone = ? WHERE id = ? AND customer_id = ?',
            [label, region || null, city, sub_city || null, street, details || null, phone || null, addressId, customerId]
        );

        const [updatedRow] = await pool.query('SELECT * FROM customer_addresses WHERE id = ?', [addressId]);
        res.json((updatedRow as any[])[0]);
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ error: 'Unable to update address.' });
    }
};

// Delete Address
export const deleteAddress = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const addressId = req.params.id;

        // Ensure ownership
        const [existing] = await pool.query('SELECT id, is_default FROM customer_addresses WHERE id = ? AND customer_id = ?', [addressId, customerId]);
        if ((existing as any[]).length === 0) {
            return res.status(404).json({ error: 'Address not found or unauthorized.' });
        }

        await pool.query('DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?', [addressId, customerId]);

        // If default was deleted, make the most recent address default
        if ((existing as any[])[0].is_default) {
            const [others] = await pool.query('SELECT id FROM customer_addresses WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1', [customerId]);
            if ((others as any[]).length > 0) {
                await pool.query('UPDATE customer_addresses SET is_default = TRUE WHERE id = ?', [(others as any[])[0].id]);
            }
        }

        res.json({ message: 'Address deleted successfully.' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ error: 'Unable to delete address.' });
    }
};

// Set Default Address
export const setDefaultAddress = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const addressId = req.params.id;

        // Ensure ownership
        const [existing] = await pool.query('SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?', [addressId, customerId]);
        if ((existing as any[]).length === 0) {
            return res.status(404).json({ error: 'Address not found or unauthorized.' });
        }

        // Unset all others
        await pool.query('UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = ?', [customerId]);
        // Set new default
        await pool.query('UPDATE customer_addresses SET is_default = TRUE WHERE id = ? AND customer_id = ?', [addressId, customerId]);

        res.json({ message: 'Default address updated successfully.' });
    } catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).json({ error: 'Unable to set default address.' });
    }
};

// Get Notification Preferences
export const getPreferences = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        let [rows] = await pool.query('SELECT * FROM customer_notification_preferences WHERE customer_id = ?', [customerId]);
        
        if ((rows as any[]).length === 0) {
            // Create default preferences
            await pool.query(
                'INSERT INTO customer_notification_preferences (customer_id, order_updates, prescription_updates, promotional_updates) VALUES (?, true, true, false)',
                [customerId]
            );
            [rows] = await pool.query('SELECT * FROM customer_notification_preferences WHERE customer_id = ?', [customerId]);
        }

        res.json((rows as any[])[0]);
    } catch (error) {
        console.error('Error fetching preferences:', error);
        res.status(500).json({ error: 'Unable to load preferences.' });
    }
};

// Update Notification Preferences
export const updatePreferences = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const { order_updates, prescription_updates, promotional_updates } = req.body;

        // Upsert logic
        const [existing] = await pool.query('SELECT customer_id FROM customer_notification_preferences WHERE customer_id = ?', [customerId]);
        
        if ((existing as any[]).length === 0) {
            await pool.query(
                'INSERT INTO customer_notification_preferences (customer_id, order_updates, prescription_updates, promotional_updates) VALUES (?, ?, ?, ?)',
                [customerId, order_updates ? 1 : 0, prescription_updates ? 1 : 0, promotional_updates ? 1 : 0]
            );
        } else {
            await pool.query(
                'UPDATE customer_notification_preferences SET order_updates = ?, prescription_updates = ?, promotional_updates = ? WHERE customer_id = ?',
                [order_updates ? 1 : 0, prescription_updates ? 1 : 0, promotional_updates ? 1 : 0, customerId]
            );
        }

        const [rows] = await pool.query('SELECT * FROM customer_notification_preferences WHERE customer_id = ?', [customerId]);
        res.json((rows as any[])[0]);
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: 'Unable to update preferences.' });
    }
};
