const mysql = require('mysql2/promise');

async function fixDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'vinacoach'
    });

    console.log('Connected to DB. Checking if cancel_reason exists...');
    
    // Check if column exists
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'vinacoach' 
        AND TABLE_NAME = 'trips' 
        AND COLUMN_NAME = 'cancel_reason'
    `);
    
    if (rows.length === 0) {
      console.log('cancel_reason column not found. Adding it now...');
      await connection.query('ALTER TABLE trips ADD COLUMN cancel_reason VARCHAR(500) NULL AFTER status');
      console.log('Column added successfully!');
    } else {
      console.log('cancel_reason column already exists.');
    }
    
    await connection.end();
  } catch (err) {
    console.error('Error fixing DB:', err);
  }
}

fixDB();
