import { Router } from 'express';
import { 
  getDashboardSummary,
  getSalesReport,
  getInventoryReport,
  getOrderReport,
  getPrescriptionReport,
  getProductReport,
  getCustomerReport
} from '../controllers/reportController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all report routes, restricting to admin
router.use(requireAuth);
router.use(requireRole(['admin']));

// Report endpoints
router.get('/dashboard', getDashboardSummary);
router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);
router.get('/orders', getOrderReport);
router.get('/prescriptions', getPrescriptionReport);
router.get('/products', getProductReport);
router.get('/customers', getCustomerReport);

export default router;
