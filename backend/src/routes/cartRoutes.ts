import express from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart, validateCart } from '../controllers/cartController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All cart routes require a logged in customer
router.use(requireAuth);
router.use(requireRole(['customer']));

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItem);
router.delete('/:id', removeCartItem);
router.delete('/', clearCart);
router.post('/validate', validateCart);

export default router;
