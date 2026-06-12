const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'vinacoach'
  });

  try {
    await connection.execute('ALTER TABLE tickets ADD COLUMN guest_phone VARCHAR(20) NULL AFTER guest_name');
    console.log('Đã thêm cột guest_phone vào bảng tickets');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Cột guest_phone đã tồn tại');
    } else {
      console.error(err);
    }
  }

  await connection.end();
}

run().catch(console.error);
