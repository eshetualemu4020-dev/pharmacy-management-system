import express from 'express';
import { getAuditLogs, getAuditLogById } from '../controllers/auditController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/', getAuditLogs);
router.get('/:id', getAuditLogById);

export default router;
