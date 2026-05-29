const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'vinacoach'
  });

  const buses = [
    { licensePlate: '29B-123.45', totalSeats: 34, busType: 'Giường nằm', isActive: true },
    { licensePlate: '29B-678.90', totalSeats: 34, busType: 'Giường nằm', isActive: true },
    { licensePlate: '29B-111.22', totalSeats: 22, busType: 'Limousine', isActive: true },
    { licensePlate: '29B-333.44', totalSeats: 22, busType: 'Limousine', isActive: true },
    { licensePlate: '29B-555.66', totalSeats: 45, busType: 'Ghế ngồi', isActive: true },
    { licensePlate: '30F-123.45', totalSeats: 34, busType: 'Giường nằm', isActive: true },
    { licensePlate: '30F-999.99', totalSeats: 22, busType: 'Limousine', isActive: true },
    { licensePlate: '51B-123.45', totalSeats: 40, busType: 'Giường nằm', isActive: true },
    { licensePlate: '51B-678.90', totalSeats: 40, busType: 'Giường nằm', isActive: true }
  ];

  for (const b of buses) {
    const [rows] = await connection.execute('SELECT id FROM buses WHERE license_plate = ?', [b.licensePlate]);
    if (rows.length === 0) {
      await connection.execute('INSERT INTO buses (license_plate, total_seats, bus_type, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())', 
        [b.licensePlate, b.totalSeats, b.busType, b.isActive]);
      console.log(`Đã thêm xe: ${b.licensePlate}`);
    } else {
      console.log(`Xe ${b.licensePlate} đã tồn tại, bỏ qua.`);
    }
  }

  await connection.end();
}

run().catch(console.error);
