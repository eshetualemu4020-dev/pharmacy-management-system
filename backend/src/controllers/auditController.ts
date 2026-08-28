import { Request, Response } from 'express';
import db from '../config/db.js';

export const getAuditLogs = async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      page = '1', 
      limit = '15', 
      module, 
      action, 
      userId, 
      search, 
      dateRange 
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const params: any[] = [];
    
    let whereClause = '1=1';

    if (module) {
      whereClause += ' AND a.module = ?';
      params.push(module);
    }
    
    if (action) {
      whereClause += ' AND a.action = ?';
      params.push(action);
    }
    
    if (userId) {
      whereClause += ' AND a.user_id = ?';
      params.push(userId);
    }
    
    if (search) {
      whereClause += ' AND (a.description LIKE ? OR u.username LIKE ? OR a.target_id LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (dateRange) {
      if (dateRange === 'today') {
        whereClause += ' AND DATE(a.created_at) = CURDATE()';
      } else if (dateRange === 'yesterday') {
        whereClause += ' AND DATE(a.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
      } else if (dateRange === 'this_week') {
        whereClause += ' AND YEARWEEK(a.created_at, 1) = YEARWEEK(CURDATE(), 1)';
      } else if (dateRange === 'this_month') {
        whereClause += ' AND MONTH(a.created_at) = MONTH(CURDATE()) AND YEAR(a.created_at) = YEAR(CURDATE())';
      } else if (dateRange === 'last_month') {
        whereClause += ' AND MONTH(a.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(a.created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))';
      }
    }

    // Get total count
    const [countRows]: any = await db.query(
      `SELECT COUNT(*) as total FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Get logs with pagination
    const query = `
      SELECT a.*, u.username, u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit as string), offset);

    const [logs] = await db.query(query, params);

    res.json({
      data: logs,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

export const getAuditLogById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const query = `
      SELECT a.*, u.username, u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `;
    const [rows]: any = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching audit log by id:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
};
