import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { 
    getPurchaseOrders, 
    getPurchaseOrderById, 
    createPurchaseOrder, 
    updatePurchaseOrderStatus, 
    receivePurchaseOrder 
} from '../controllers/purchaseOrderController.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/', getPurchaseOrders);
router.post('/', createPurchaseOrder);
router.get('/:id', getPurchaseOrderById);
router.put('/:id/status', updatePurchaseOrderStatus);
router.post('/:id/receive', receivePurchaseOrder);

export default router;
