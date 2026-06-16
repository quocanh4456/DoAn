const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '../migration_promotions.sql'), 'utf8');

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'vinacoach',
    multipleStatements: true
  });

  try {
    console.log('Đang chạy file migration...');
    await connection.query(sql);
    console.log('Migration thành công!');
  } catch (err) {
    console.error('Lỗi migration:', err);
  } finally {
    await connection.end();
  }
}

run();
