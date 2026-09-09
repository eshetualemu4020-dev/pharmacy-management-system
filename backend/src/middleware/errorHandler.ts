import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled Error:', err);
    
    // Default error status
    let statusCode = err.status || err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let code = err.code || 'INTERNAL_ERROR';

    if (err.name === 'ZodError') {
        statusCode = 400;
        message = 'Validation Failed';
        code = 'VALIDATION_ERROR';
    } else if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = 'Duplicate entry detected.';
        code = 'CONFLICT_ERROR';
    }

    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            details: err.name === 'ZodError' ? err.errors : undefined
        }
    });
};
