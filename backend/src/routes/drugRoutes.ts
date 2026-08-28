import { Router } from 'express';
import { 
    getDrugs, 
    getDrugById, 
    createDrug, 
    updateDrug, 
    updateDrugStatus 
} from '../controllers/drugController.js';

import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getDrugs);
router.post('/', requireRole(['admin']), createDrug);
router.get('/:id', getDrugById);
router.put('/:id', requireRole(['admin']), updateDrug);
router.patch('/:id/status', requireRole(['admin']), updateDrugStatus);

export default router;
