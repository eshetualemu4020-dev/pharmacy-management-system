import { Router } from 'express';
import { getCatalog, getCatalogDrugById, getDosageForms, getCatalogCategories } from '../controllers/catalogController.js';

const router = Router();

router.get('/drugs', getCatalog);
router.get('/drugs/:id', getCatalogDrugById);
router.get('/dosage-forms', getDosageForms);
router.get('/categories', getCatalogCategories);

export default router;
