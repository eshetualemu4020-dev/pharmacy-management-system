import express from 'express';
import { getMyOrders, getMyOrderById, cancelMyOrder, checkout, confirmPayment } from '../controllers/customerOrderController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['customer']));

router.get('/', getMyOrders);
router.get('/:id', getMyOrderById);
router.post('/checkout', checkout);
router.post('/:id/confirm-payment', confirmPayment);
router.post('/:id/cancel', cancelMyOrder);

export default router;
