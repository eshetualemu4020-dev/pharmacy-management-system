import { Router } from 'express';
import { 
    getCategories, 
    getCategoryById, 
    createCategory, 
    updateCategory, 
    updateCategoryStatus, 
    deleteCategory 
} from '../controllers/categoryController.js';

const router = Router();

router.get('/', getCategories);
router.post('/', createCategory);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.patch('/:id/status', updateCategoryStatus);
router.delete('/:id', deleteCategory);

export default router;
