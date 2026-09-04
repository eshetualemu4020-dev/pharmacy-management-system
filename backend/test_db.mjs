import mysql from 'mysql2/promise';

async function test() {
  const db = await mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pharmacy_db'
  });

  const category = '1';
  let query = `
      SELECT d.id, d.name, d.generic_name, d.brand_name, d.description, 
             d.dosage_form, d.strength, d.price, d.requires_prescription, 
             d.qty, d.image_url, c.name as category_name
      FROM drugs d
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.is_active = 1
  `;
  const params = [];

  query += ' AND d.category_id = ?';
  params.push(category);

  const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subset`;
  
  try {
    const [countResult] = await db.query(countQuery, params);
    console.log('Count success:', countResult);
  } catch (err) {
    console.error('Count error:', err);
  }

  try {
    const query2 = query + ' ORDER BY d.name ASC LIMIT ? OFFSET ?';
    params.push(12, 0);
    const [drugs] = await db.query(query2, params);
    console.log('Drugs success:', drugs.length);
  } catch (err) {
    console.error('Drugs error:', err);
  }

  process.exit();
}

test();
