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

// Apply auth middleware to all report routes
router.use(requireAuth);

// Admin-only dashboards (contains sensitive high-level financials)
router.get('/dashboard', requireRole(['admin']), getDashboardSummary);
router.get('/customers', requireRole(['admin']), getCustomerReport);

// Operational reports (admin + pharmacist)
router.get('/sales', requireRole(['admin', 'pharmacist']), getSalesReport);
router.get('/inventory', requireRole(['admin', 'pharmacist']), getInventoryReport);
router.get('/orders', requireRole(['admin', 'pharmacist']), getOrderReport);
router.get('/prescriptions', requireRole(['admin', 'pharmacist']), getPrescriptionReport);
router.get('/products', requireRole(['admin', 'pharmacist']), getProductReport);

export default router;
