import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getSuppliers, getSupplierById, createSupplier, updateSupplier, updateSupplierStatus } from '../controllers/supplierController.js';

const router = Router();

// All supplier routes require authentication and admin role (or inventory_staff if desired)
// Assuming Admin manages suppliers.
router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.patch('/:id/status', updateSupplierStatus);

export default router;
