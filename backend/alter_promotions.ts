import pool from './src/config/db.js';

async function migratePromotions() {
  const connection = await pool.getConnection();
  try {
    console.log('Starting promotions migration...');

    // Drop tables if they already exist from previous incomplete attempts
    await connection.query(`DROP TABLE IF EXISTS promotion_drugs;`);
    await connection.query(`DROP TABLE IF EXISTS promotion_categories;`);

    // We can't simply ADD COLUMN if the table already has it.
    // Let's drop the entire promotions table since the system doesn't have any real promotions data yet based on requirements,
    // and recreate it to match the new schema precisely.
    await connection.query(`DROP TABLE IF EXISTS promotions;`);

    console.log('Creating promotions table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS promotions (
          id              INT AUTO_INCREMENT PRIMARY KEY,
          name            VARCHAR(150) NOT NULL,
          description     TEXT,
          discount_type   ENUM('percentage','fixed') NOT NULL,
          discount_value  DECIMAL(10,2) NOT NULL,
          start_date      DATE NOT NULL,
          end_date        DATE NOT NULL,
          status          ENUM('draft','scheduled','active','expired','inactive') DEFAULT 'draft',
          created_by      INT,
          created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    console.log('Creating promotion_drugs table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS promotion_drugs (
          promotion_id INT NOT NULL,
          drug_id INT NOT NULL,
          PRIMARY KEY(promotion_id, drug_id),
          FOREIGN KEY(promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
          FOREIGN KEY(drug_id) REFERENCES drugs(id) ON DELETE CASCADE
      );
    `);

    console.log('Creating promotion_categories table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS promotion_categories (
          promotion_id INT NOT NULL,
          category_id INT NOT NULL,
          PRIMARY KEY(promotion_id, category_id),
          FOREIGN KEY(promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
          FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migratePromotions();
