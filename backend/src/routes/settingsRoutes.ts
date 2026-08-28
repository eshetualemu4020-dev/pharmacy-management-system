import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
