import express from 'express';
import { getInventorySummary, getInventoryList, getDrugBatches, getAllBatches, adjustStock, getTransactionHistory } from '../controllers/inventoryController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
// Allow admin, and pharmacist to access GET routes
router.use(requireRole(['admin', 'pharmacist']));

router.get('/summary', getInventorySummary);
router.get('/batches/all', getAllBatches);
router.get('/', getInventoryList);
router.get('/:drugId/batches', getDrugBatches);
// Restrict adjustment exclusively to admin
router.post('/adjust', requireRole(['admin']), adjustStock);
router.get('/transactions/history', getTransactionHistory);

export default router;
