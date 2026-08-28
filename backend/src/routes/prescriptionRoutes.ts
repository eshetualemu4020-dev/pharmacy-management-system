import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getAllPrescriptions, getPrescriptionById, getPrescriptionFile } from '../controllers/prescriptionController';

const router = express.Router();

// Only admin can access these oversight routes.
// (Pharmacists would have their own routes or role added to these depending on the exact requirements)
router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/', getAllPrescriptions);
router.get('/:id', getPrescriptionById);
router.get('/:id/file', getPrescriptionFile);

export default router;
