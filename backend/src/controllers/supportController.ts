import { Request, Response } from 'express';
import pool from '../config/db.js';
import { createNotification } from './notificationController.js';

// Get all tickets for customer
export const getTickets = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const [rows] = await pool.query(
            'SELECT id, order_id, issue_type, subject, status, created_at, updated_at FROM support_tickets WHERE customer_id = ? ORDER BY created_at DESC',
            [customerId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching support tickets:', error);
        res.status(500).json({ error: 'Unable to load support tickets.' });
    }
};

// Create new ticket
export const createTicket = async (req: Request, res: Response): Promise<any> => {
    const connection = await pool.getConnection();
    try {
        const customerId = req.user?.id;
        const { order_id, issue_type, subject, description } = req.body;

        if (!issue_type || !subject || !description) {
            return res.status(400).json({ error: 'Issue type, subject, and description are required.' });
        }

        await connection.beginTransaction();

        // If order_id is provided, verify it belongs to the customer
        if (order_id) {
            const [orders] = await connection.query('SELECT id FROM orders WHERE id = ? AND customer_id = ?', [order_id, customerId]);
            if ((orders as any[]).length === 0) {
                await connection.rollback();
                return res.status(403).json({ error: 'Order not found or unauthorized.' });
            }
        }

        const [result] = await connection.query(
            'INSERT INTO support_tickets (customer_id, order_id, issue_type, subject, description) VALUES (?, ?, ?, ?, ?)',
            [customerId, order_id || null, issue_type, subject, description]
        );
        const ticketId = (result as any).insertId;

        // Send confirmation notification
        await createNotification(
            connection,
            customerId,
            'SYSTEM',
            'Support Request Received',
            `Your support request SUP-${ticketId} has been successfully submitted. We will review it shortly.`,
            ticketId
        );

        await connection.commit();

        const [newTicketRows] = await pool.query('SELECT * FROM support_tickets WHERE id = ?', [ticketId]);
        res.status(201).json((newTicketRows as any[])[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating support ticket:', error);
        res.status(500).json({ error: 'Unable to submit your support request.' });
    } finally {
        connection.release();
    }
};

// Get ticket details and responses
export const getTicketDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const ticketId = req.params.id;

        // Verify ownership
        const [tickets] = await pool.query('SELECT * FROM support_tickets WHERE id = ? AND customer_id = ?', [ticketId, customerId]);
        if ((tickets as any[]).length === 0) {
            return res.status(404).json({ error: 'Support request not found.' });
        }
        const ticket = (tickets as any[])[0];

        // Fetch responses
        const [responses] = await pool.query('SELECT * FROM support_ticket_responses WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId]);

        res.json({
            ticket,
            responses
        });
    } catch (error) {
        console.error('Error fetching ticket details:', error);
        res.status(500).json({ error: 'Unable to load ticket details.' });
    }
};

// Reply to a ticket
export const replyToTicket = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.user?.id;
        const ticketId = req.params.id;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message cannot be empty.' });
        }

        // Verify ownership
        const [tickets] = await pool.query('SELECT id, status FROM support_tickets WHERE id = ? AND customer_id = ?', [ticketId, customerId]);
        if ((tickets as any[]).length === 0) {
            return res.status(404).json({ error: 'Support request not found.' });
        }

        const ticketStatus = (tickets as any[])[0].status;
        if (ticketStatus === 'Closed') {
            return res.status(400).json({ error: 'Cannot reply to a closed support ticket.' });
        }

        await pool.query(
            'INSERT INTO support_ticket_responses (ticket_id, sender_type, sender_id, message) VALUES (?, ?, ?, ?)',
            [ticketId, 'customer', customerId, message]
        );

        // Optionally, if status was Resolved, reopen it
        if (ticketStatus === 'Resolved') {
            await pool.query("UPDATE support_tickets SET status = 'Open' WHERE id = ?", [ticketId]);
        }

        const [newResponseRows] = await pool.query('SELECT * FROM support_ticket_responses WHERE ticket_id = ? ORDER BY id DESC LIMIT 1', [ticketId]);
        res.status(201).json((newResponseRows as any[])[0]);
    } catch (error) {
        console.error('Error replying to ticket:', error);
        res.status(500).json({ error: 'Unable to submit your response.' });
    }
};
