import express from 'express';
import { 
    getCustomers, 
    getCustomerStats,
    getCustomerById, 
    getCustomerOrders, 
    getCustomerSales, 
    getCustomerPrescriptions 
} from '../controllers/customerController.js';
import {
    getProfile,
    updateProfile,
    changePassword,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getPreferences,
    updatePreferences
} from '../controllers/customerProfileController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// Customer Profile Routes (Authenticated as Customer)
// ==========================================
router.get('/profile', requireAuth, requireRole(['customer']), getProfile);
router.put('/profile', requireAuth, requireRole(['customer']), updateProfile);
router.put('/profile/password', requireAuth, requireRole(['customer']), changePassword);

router.get('/addresses', requireAuth, requireRole(['customer']), getAddresses);
router.post('/addresses', requireAuth, requireRole(['customer']), addAddress);
router.put('/addresses/:id', requireAuth, requireRole(['customer']), updateAddress);
router.delete('/addresses/:id', requireAuth, requireRole(['customer']), deleteAddress);
router.put('/addresses/:id/default', requireAuth, requireRole(['customer']), setDefaultAddress);

router.get('/preferences', requireAuth, requireRole(['customer']), getPreferences);
router.put('/preferences', requireAuth, requireRole(['customer']), updatePreferences);


// ==========================================
// Admin/Pharmacist Routes for Customers
// ==========================================
router.use(requireAuth);
router.use(requireRole(['admin', 'pharmacist']));

router.get('/', getCustomers);
router.get('/stats', getCustomerStats);
router.get('/:id', getCustomerById);
router.get('/:id/orders', getCustomerOrders);
router.get('/:id/sales', getCustomerSales);
router.get('/:id/prescriptions', getCustomerPrescriptions);

export default router;
