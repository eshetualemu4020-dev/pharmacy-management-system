import express from 'express';
import { getOrders, getOrderById, updateOrderStatus, cancelOrder } from '../controllers/orderController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['admin', 'staff', 'pharmacist']));

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/cancel', cancelOrder);

export default router;
