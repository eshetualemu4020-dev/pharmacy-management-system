import connection from '../config/db.js';

const runMigrations = async () => {
    try {
        console.log('Adding database indexes for Phase 3...');

        try {
            await connection.query(`CREATE INDEX idx_stock_movements_batch ON stock_movements(batch_id);`);
            console.log('Added index on stock_movements(batch_id)');
        } catch (e: any) { if (e.code !== 'ER_DUP_KEYNAME') throw e; }

        try {
            await connection.query(`CREATE INDEX idx_orders_status ON orders(status);`);
            console.log('Added index on orders(status)');
        } catch (e: any) { if (e.code !== 'ER_DUP_KEYNAME') throw e; }

        try {
            await connection.query(`CREATE INDEX idx_batches_exp ON batches(exp_date);`);
            console.log('Added index on batches(exp_date)');
        } catch (e: any) { if (e.code !== 'ER_DUP_KEYNAME') throw e; }

        console.log('All Phase 3 indexes added successfully.');
        process.exit(0);
    } catch (error: any) {
        console.error('Error adding indexes:', error);
        process.exit(1);
    }
};

runMigrations();
