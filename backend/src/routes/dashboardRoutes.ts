import express from 'express';
import { getAdminStats, getPharmacistStats } from '../controllers/dashboardController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/admin/stats', requireAuth, requireRole(['admin']), getAdminStats);
router.get('/pharmacist/stats', requireAuth, requireRole(['pharmacist', 'admin']), getPharmacistStats);

export default router;
