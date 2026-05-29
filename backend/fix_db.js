const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'vinacoach'
  });

  // 1. Đặt lại mật khẩu cho tài khoản buihai2408@gmail.com thành 123456
  const hash = await bcrypt.hash('123456', 10);
  await connection.execute('UPDATE users SET password = ? WHERE email = ?', [hash, 'buihai2408@gmail.com']);
  console.log('Đã reset mật khẩu cho tài khoản buihai2408@gmail.com thành: 123456');

  // 2. Thêm các tuyến xe từ Hà Nội
  const routes = [
    { origin: 'Hà Nội', destination: 'Đà Nẵng', distance: 766, basePrice: 500000 },
    { origin: 'Hà Nội', destination: 'Sapa', distance: 315, basePrice: 300000 },
    { origin: 'Hà Nội', destination: 'Hải Phòng', distance: 120, basePrice: 150000 },
    { origin: 'Hà Nội', destination: 'Hạ Long', distance: 150, basePrice: 200000 },
    { origin: 'Hà Nội', destination: 'Ninh Bình', distance: 95, basePrice: 120000 },
    { origin: 'Hà Nội', destination: 'Vinh', distance: 300, basePrice: 250000 },
    { origin: 'Hà Nội', destination: 'Huế', distance: 680, basePrice: 450000 },
    { origin: 'Hà Nội', destination: 'Mộc Châu', distance: 190, basePrice: 220000 },
    { origin: 'Hà Nội', destination: 'Điện Biên', distance: 450, basePrice: 400000 }
  ];

  for (const r of routes) {
    // Kiểm tra xem đã tồn tại tuyến này chưa
    const [rows] = await connection.execute('SELECT id FROM routes WHERE origin = ? AND destination = ?', [r.origin, r.destination]);
    if (rows.length === 0) {
      await connection.execute('INSERT INTO routes (origin, destination, distance, base_price, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())', 
        [r.origin, r.destination, r.distance, r.basePrice]);
      console.log(`Đã thêm tuyến: ${r.origin} -> ${r.destination}`);
    } else {
      console.log(`Tuyến ${r.origin} -> ${r.destination} đã tồn tại, bỏ qua.`);
    }
  }

  await connection.end();
}

run().catch(console.error);
