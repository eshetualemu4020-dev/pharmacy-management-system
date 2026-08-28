import express from 'express';
import { getCustomers } from '../controllers/customerController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, getCustomers);

export default router;
