import { PoolConnection } from 'mysql2/promise';

export const deductStock = async (
    connection: PoolConnection,
    drugId: number,
    requestedBatchId: number | null | undefined,
    quantity: number,
    reason: 'sale' | 'return' | 'purchase_receive' | 'adjustment' | 'dispense',
    referenceTable: string,
    referenceId: number,
    userId: number
) => {
    // 1. Lock the drug master record
    const [drugRows]: any = await connection.query('SELECT stock, name FROM drugs WHERE id = ? FOR UPDATE', [drugId]);
    if (drugRows.length === 0) {
        throw new Error(`Drug with ID ${drugId} not found`);
    }
    const drug = drugRows[0];
    if (drug.stock < quantity) {
        throw new Error(`Insufficient stock for drug ${drug.name}. Available: ${drug.stock}, Requested: ${quantity}`);
    }

    let remainingToDeduct = quantity;
    const batchesUsed: { batch_id: number, qty: number }[] = [];

    if (requestedBatchId) {
        // Specific batch requested
        const [batchRows]: any = await connection.query('SELECT id, quantity, exp_date FROM batches WHERE id = ? FOR UPDATE', [requestedBatchId]);
        if (batchRows.length === 0) {
            throw new Error(`Batch ID ${requestedBatchId} not found for drug ${drug.name}`);
        }
        const batch = batchRows[0];

        const batchExpDate = new Date(batch.exp_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (batchExpDate < today) {
            throw new Error(`Cannot sell: Batch ${batch.batch_number || batch.id} for drug ${drug.name} has expired.`);
        }

        if (batch.quantity < quantity) {
            throw new Error(`Insufficient stock in batch ${batch.batch_number || batch.id} for drug ${drug.name}. Available: ${batch.quantity}`);
        }

        const [updateResult]: any = await connection.query(
            'UPDATE batches SET quantity = quantity - ? WHERE id = ? AND quantity >= ?',
            [quantity, requestedBatchId, quantity]
        );
        if (updateResult.affectedRows === 0) {
            throw new Error('Concurrency conflict: Failed to deduct stock from batch.');
        }

        batchesUsed.push({ batch_id: requestedBatchId, qty: quantity });
        remainingToDeduct = 0;
    } else {
        // FEFO: First-Expire-First-Out logic for batches
        const [availableBatches]: any = await connection.query(
            `SELECT id, quantity, exp_date FROM batches 
             WHERE drug_id = ? AND quantity > 0 AND exp_date >= CURDATE() 
             ORDER BY exp_date ASC FOR UPDATE`,
            [drugId]
        );

        for (const batch of availableBatches) {
            if (remainingToDeduct <= 0) break;

            const qtyToDeduct = Math.min(batch.quantity, remainingToDeduct);
            const [updateResult]: any = await connection.query(
                'UPDATE batches SET quantity = quantity - ? WHERE id = ? AND quantity >= ?',
                [qtyToDeduct, batch.id, qtyToDeduct]
            );

            if (updateResult.affectedRows > 0) {
                batchesUsed.push({ batch_id: batch.id, qty: qtyToDeduct });
                remainingToDeduct -= qtyToDeduct;
            }
        }

        if (remainingToDeduct > 0) {
            throw new Error(`Insufficient valid/unexpired batch stock for drug ${drug.name}.`);
        }
    }

    // Deduct from total drug stock
    const [drugUpdateResult]: any = await connection.query(
        'UPDATE drugs SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [quantity, drugId, quantity]
    );
    if (drugUpdateResult.affectedRows === 0) {
        throw new Error('Concurrency conflict: Failed to deduct total stock.');
    }

    // Log stock movements
    for (const bu of batchesUsed) {
        await connection.query(
            `INSERT INTO stock_movements (drug_id, batch_id, change_qty, reason, reference_table, reference_id, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [drugId, bu.batch_id, -bu.qty, reason, referenceTable, referenceId, userId]
        );
        // Also log to existing inventory_transactions for backwards compatibility if needed
        await connection.query(
            `INSERT INTO inventory_transactions (drug_id, batch_id, transaction_type, quantity, remarks)
             VALUES (?, ?, 'REMOVE', ?, ?)`,
            [drugId, bu.batch_id, bu.qty, `${reason} #${referenceId}`]
        );
    }

    return batchesUsed;
};

export const addStock = async (
    connection: PoolConnection,
    drugId: number,
    batchId: number | null,
    quantity: number,
    reason: 'sale' | 'return' | 'purchase_receive' | 'adjustment' | 'dispense',
    referenceTable: string,
    referenceId: number,
    userId: number
) => {
    // Add to total drug stock
    await connection.query('UPDATE drugs SET stock = stock + ? WHERE id = ?', [quantity, drugId]);
    
    if (batchId) {
        await connection.query('UPDATE batches SET quantity = quantity + ? WHERE id = ?', [quantity, batchId]);
    }

    // Log stock movement
    await connection.query(
        `INSERT INTO stock_movements (drug_id, batch_id, change_qty, reason, reference_table, reference_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [drugId, batchId, quantity, reason, referenceTable, referenceId, userId]
    );

    // Also log to existing inventory_transactions for backwards compatibility
    await connection.query(
        `INSERT INTO inventory_transactions (drug_id, batch_id, transaction_type, quantity, remarks)
         VALUES (?, ?, 'ADD', ?, ?)`,
        [drugId, batchId || null, quantity, `${reason} #${referenceId}`]
    );
};
