import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { 
    getAllPromotions, 
    getPromotionById, 
    createPromotion, 
    updatePromotion, 
    updatePromotionStatus 
} from '../controllers/promotionController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getAllPromotions);
router.get('/:id', getPromotionById);

router.use(requireRole(['admin']));

router.post('/', createPromotion);
router.put('/:id', updatePromotion);
router.put('/:id/status', updatePromotionStatus);

export default router;
