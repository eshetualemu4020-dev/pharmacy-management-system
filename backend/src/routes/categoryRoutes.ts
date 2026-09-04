import { Router } from 'express';
import { 
    getCategories, 
    getCategoryById, 
    createCategory, 
    updateCategory, 
    updateCategoryStatus, 
    deleteCategory 
} from '../controllers/categoryController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET routes are accessible by any authenticated user
router.get('/', requireAuth, getCategories);
router.get('/:id', requireAuth, getCategoryById);

// Modifying routes require admin or staff roles
router.post('/', requireAuth, requireRole(['admin']), createCategory);
router.put('/:id', requireAuth, requireRole(['admin']), updateCategory);
router.patch('/:id/status', requireAuth, requireRole(['admin']), updateCategoryStatus);
router.delete('/:id', requireAuth, requireRole(['admin']), deleteCategory);

export default router;
