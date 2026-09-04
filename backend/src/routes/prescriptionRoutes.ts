import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getAllPrescriptions, getPrescriptionById, getPrescriptionFile, updatePrescriptionStatus } from '../controllers/prescriptionController';

const router = express.Router();

// Only admin and pharmacist can access these oversight routes.
router.use(requireAuth);
router.use(requireRole(['admin', 'pharmacist']));

router.get('/', getAllPrescriptions);
router.get('/:id', getPrescriptionById);
router.get('/:id/file', getPrescriptionFile);
router.post('/:id/review', updatePrescriptionStatus);

export default router;
