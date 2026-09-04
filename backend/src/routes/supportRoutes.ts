import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
    getTickets,
    getTicketDetails,
    createTicket,
    replyToTicket
} from '../controllers/supportController.js';

const router = express.Router();

// All customer support routes must be authenticated and restricted to the 'customer' role
router.use(requireAuth);
router.use(requireRole(['customer']));

router.get('/tickets', getTickets);
router.get('/tickets/:id', getTicketDetails);
router.post('/tickets', createTicket);
router.post('/tickets/:id/responses', replyToTicket);

export default router;
