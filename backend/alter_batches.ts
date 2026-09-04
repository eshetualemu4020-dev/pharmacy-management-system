import pool from './src/config/db.js';

async function alterBatches() {
    try {
        console.log('Altering batches table...');
        
        await pool.query(`
            ALTER TABLE batches 
            ADD COLUMN supplier_id INT NULL AFTER quantity,
            ADD COLUMN purchase_order_id INT NULL AFTER supplier_id,
            ADD COLUMN received_date DATE NULL AFTER exp_date
        `);
        console.log('Columns added.');

        await pool.query(`
            ALTER TABLE batches ADD CONSTRAINT fk_batches_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        `);
        console.log('Supplier FK added.');

        await pool.query(`
            ALTER TABLE batches ADD CONSTRAINT fk_batches_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
        `);
        console.log('Purchase Order FK added.');

        console.log('batches table altered successfully.');
    } catch (err: any) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('batches table already has the new columns.');
        } else if (err.code === 'ER_CANT_CREATE_TABLE' || err.code === 'ER_DUP_KEYNAME') {
            console.log('FK already exists or error:', err.message);
        } else {
            console.error('Error altering batches table:', err);
        }
    }

    console.log('Migration completed.');
    process.exit(0);
}

alterBatches();
