import cron from 'node-cron';
import connection from '../config/db.js';
import { logger } from '../utils/logger.js';

// Auto-expire promotions
cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily promotion expiration check...');
    try {
        const [result]: any = await connection.query(`
            UPDATE promotions 
            SET status = 'expired' 
            WHERE end_date < CURDATE() AND status = 'active'
        `);
        logger.info(`Expired ${result.affectedRows} promotions.`);
    } catch (error) {
        logger.error('Error auto-expiring promotions:', error);
    }
});

// Nightly low-stock digest (runs at 1:00 AM)
cron.schedule('0 1 * * *', async () => {
    logger.info('Generating nightly low-stock digest...');
    try {
        const [lowStockDrugs]: any = await connection.query(`
            SELECT d.id, d.name, d.min_stock_level,
            COALESCE((SELECT SUM(quantity) FROM batches b WHERE b.drug_id = d.id AND b.exp_date > CURDATE()), 0) AS current_stock
            FROM drugs d
            HAVING current_stock <= min_stock_level
        `);

        if (lowStockDrugs.length > 0) {
            logger.warn(`Found ${lowStockDrugs.length} drugs with low stock. Admin notification generated.`);
            // In a real system, you would send an email or push an alert to an admin/pharmacist here.
        } else {
            logger.info('No low stock drugs found.');
        }
    } catch (error) {
        logger.error('Error generating low-stock digest:', error);
    }
});

// Flag stale pending prescriptions (older than 3 days)
cron.schedule('0 2 * * *', async () => {
    logger.info('Flagging stale pending prescriptions...');
    try {
        const [result]: any = await connection.query(`
            UPDATE prescriptions 
            SET status = 'needs_review' 
            WHERE status = 'pending' AND created_at < DATE_SUB(NOW(), INTERVAL 3 DAY)
        `);
        if (result.affectedRows > 0) {
            logger.info(`Flagged ${result.affectedRows} stale prescriptions for review.`);
        }
    } catch (error) {
        logger.error('Error flagging stale prescriptions:', error);
    }
});
