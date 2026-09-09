import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Extend the Express Request object to include `user`
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): any => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): any => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

export const roleCapabilities: Record<string, string[]> = {
    admin: ['manage_inventory', 'manage_users', 'review_prescriptions', 'view_reports', 'manage_promotions', 'adjust_stock'],
    pharmacist: ['view_inventory', 'review_prescriptions', 'process_sales'],
    customer: ['place_orders', 'view_own_orders', 'manage_own_prescriptions']
};

export const requireCapability = (capability: string) => {
    return (req: Request, res: Response, next: NextFunction): any => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: 'Forbidden: No role assigned' });
        }
        const capabilities = roleCapabilities[req.user.role] || [];
        if (!capabilities.includes(capability)) {
            return res.status(403).json({ error: `Forbidden: Missing capability ${capability}` });
        }
        next();
    };
};
