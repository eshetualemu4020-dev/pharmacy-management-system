import express from 'express';
import { getSales, getSaleById, getSalesSummary, refundSale, createSale } from '../controllers/salesController.js';

const router = express.Router();

router.get('/summary', getSalesSummary);
router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.post('/:id/refund', refundSale);

export default router;
