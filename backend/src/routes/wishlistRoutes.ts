import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Only authenticated customers can manage their own wishlist
router.use(requireAuth);
router.use(requireRole(['customer']));

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:drugId', removeFromWishlist);

export default router;
