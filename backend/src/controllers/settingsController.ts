import { Request, Response } from 'express';
import db from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

export const getSettings = async (req: Request, res: Response): Promise<any> => {
  try {
    const [rows]: any = await db.query(`SELECT setting_key, setting_value, setting_type FROM settings`);
    
    const settings: Record<string, any> = {};
    rows.forEach((row: any) => {
      let value = row.setting_value;
      if (row.setting_type === 'number') {
        value = Number(value);
      } else if (row.setting_type === 'boolean') {
        value = value === 'true';
      } else if (row.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = [];
        }
      }
      settings[row.setting_key] = value;
    });

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<any> => {
  const connection = await db.getConnection();
  try {
    const updates = req.body; // e.g. { low_stock_threshold: 20, pharmacy_name: 'New Name' }
    const userId = (req as any).user.id;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload' });
    }

    await connection.beginTransaction();

    // Fetch old settings for audit logging
    const [oldRows]: any = await connection.query(`SELECT setting_key, setting_value, setting_type FROM settings`);
    const oldSettingsMap = new Map(oldRows.map((r: any) => [r.setting_key, r]));

    for (const [key, val] of Object.entries(updates)) {
      const oldRow = oldSettingsMap.get(key);
      if (!oldRow) continue; // Ignore unknown settings

      let strVal = String(val);
      if (oldRow.setting_type === 'json') {
        strVal = JSON.stringify(val);
      } else if (oldRow.setting_type === 'boolean') {
        strVal = val ? 'true' : 'false';
      }

      // Basic validation based on type
      if (oldRow.setting_type === 'number' && isNaN(Number(val))) {
        throw new Error(`Invalid numeric value for setting ${key}`);
      }
      if (oldRow.setting_type === 'number' && Number(val) < 0) {
        throw new Error(`Numeric value for setting ${key} cannot be negative`);
      }

      if (oldRow.setting_value !== strVal) {
        await connection.query(
          `UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?`,
          [strVal, userId, key]
        );

        // Audit Log
        await logAudit(
          userId,
          'SETTING_UPDATE',
          `Updated setting: ${key}`,
          'settings',
          null, // No single ID for settings
          oldRow.setting_value,
          strVal,
          connection
        );
      }
    }

    await connection.commit();
    res.json({ message: 'Settings updated successfully' });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message || 'Failed to update settings' });
  } finally {
    connection.release();
  }
};
