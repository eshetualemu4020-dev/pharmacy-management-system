import express from 'express';
import { login, register, registerStaff } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = express.Router();

const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Valid email is required'),
        password: z.string().min(1, 'Password is required')
    })
});

const registerSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Valid email is required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        role: z.string().optional()
    })
});

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register); 
router.post('/register-staff', validate(registerSchema), registerStaff);

export default router;
