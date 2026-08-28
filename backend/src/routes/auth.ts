import express from 'express';
import { login, register, registerStaff } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register); // Public customer registration
router.post('/register-staff', registerStaff); // In a real app, protect this route for admin only!

export default router;
