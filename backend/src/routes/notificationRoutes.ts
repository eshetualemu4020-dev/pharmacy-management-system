import express from 'express';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All notification routes require a logged in customer
router.use(requireAuth);
router.use(requireRole(['customer']));

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
