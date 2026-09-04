import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getSuppliers, getSupplierById, createSupplier, updateSupplier, updateSupplierStatus, deleteSupplier } from '../controllers/supplierController.js';

const router = Router();

// All supplier routes require authentication and admin roles
router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.patch('/:id/status', updateSupplierStatus);
router.delete('/:id', deleteSupplier);

export default router;
