import express from 'express';
import { getSales, getSaleById, getSalesSummary, refundSale, createSale } from '../controllers/salesController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/summary', getSalesSummary);
router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.post('/:id/refund', refundSale);

export default router;
