-- =====================================================
-- VinaCoach - Hệ thống đặt vé xe khách trực tuyến
-- Database Schema + Seed Data
-- =====================================================

CREATE DATABASE IF NOT EXISTS vinacoach CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vinacoach;

-- =====================================================
-- 1. Bảng Roles (Vai trò: Admin, Staff, Customer)
-- =====================================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

-- =====================================================
-- 2. Bảng Users (Người dùng)
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- =====================================================
-- 3. Bảng Routes (Tuyến đường)
-- =====================================================
CREATE TABLE routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance FLOAT NOT NULL,
    base_price DECIMAL(12, 0) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- 4. Bảng Schedules (Khung giờ xuất bến)
-- =====================================================
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    departure_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (route_id) REFERENCES routes(id)
) ENGINE=InnoDB;

-- =====================================================
-- 5. Bảng Buses (Phương tiện)
-- =====================================================
CREATE TABLE buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    bus_type VARCHAR(50) NOT NULL,
    total_seats INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- 6. Bảng Trips (Chuyến đi thực tế)
--    driver_name: tên tài xế (text), không FK tới users
-- =====================================================
CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    bus_id INT NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    departure_date DATE NOT NULL,
    available_seats INT NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id),
    FOREIGN KEY (bus_id) REFERENCES buses(id)
) ENGINE=InnoDB;

-- =====================================================
-- 7. Bảng Tickets (Vé xe)
-- =====================================================
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    user_id INT NOT NULL,
    seat_count INT NOT NULL,
    pick_up_location VARCHAR(255) NOT NULL,
    drop_off_location VARCHAR(255) NOT NULL,
    total_price DECIMAL(12, 0) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- =====================================================
-- 8. Bảng Payments (Thanh toán)
-- =====================================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    amount DECIMAL(12, 0) NOT NULL,
    transaction_id VARCHAR(100) NULL,
    payment_method VARCHAR(20) DEFAULT 'VNPAY',
    status VARCHAR(20) DEFAULT 'PENDING',
    paid_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
) ENGINE=InnoDB;

-- =====================================================
-- SEED DATA (Dữ liệu mẫu)
-- =====================================================

-- Roles (chỉ 3 vai trò)
INSERT INTO roles (id, name) VALUES
(1, 'Admin'),
(2, 'Staff'),
(3, 'Customer');

-- Mật khẩu cho tất cả tài khoản mẫu: 123456
INSERT INTO users (full_name, email, phone, password, role_id) VALUES
('Admin VinaCoach',      'admin@vinacoach.vn',     '0900000001', '$2b$10$Q76TSmq.kef1veG2hX17QOfnmefe68V3dbaZWzMIx1Q86xQ.k0qI2', 1),
('Nguyễn Văn An',        'staff@vinacoach.vn',     '0900000002', '$2b$10$Q76TSmq.kef1veG2hX17QOfnmefe68V3dbaZWzMIx1Q86xQ.k0qI2', 2),
('Khách hàng Lê Thị C',  'customer@vinacoach.vn',  '0900000003', '$2b$10$Q76TSmq.kef1veG2hX17QOfnmefe68V3dbaZWzMIx1Q86xQ.k0qI2', 3);

-- Routes (Tuyến đường)
INSERT INTO routes (origin, destination, distance, base_price) VALUES
('TP. Hồ Chí Minh', 'Đà Lạt',        310, 250000),
('TP. Hồ Chí Minh', 'Nha Trang',      430, 300000),
('TP. Hồ Chí Minh', 'Vũng Tàu',      125, 150000),
('TP. Hồ Chí Minh', 'Cần Thơ',       170, 180000),
('TP. Hồ Chí Minh', 'Phan Thiết',    200, 200000),
('Hà Nội',          'Hải Phòng',      120, 120000),
('Hà Nội',          'Sapa',           320, 350000),
('Đà Nẵng',         'Huế',            100, 100000);

-- Schedules (Khung giờ xuất bến)
INSERT INTO schedules (route_id, departure_time) VALUES
(1, '06:00'), (1, '08:00'), (1, '13:00'), (1, '20:00'),
(2, '07:00'), (2, '19:00'),
(3, '06:30'), (3, '08:30'), (3, '14:00'), (3, '16:00'),
(4, '07:00'), (4, '14:00'),
(5, '06:00'), (5, '14:30'),
(6, '06:00'), (6, '12:00'),
(7, '20:00'),
(8, '07:00'), (8, '13:00');

-- Buses (Phương tiện)
INSERT INTO buses (license_plate, bus_type, total_seats) VALUES
('51B-111.11', 'Ghế ngồi',   16),
('51B-222.22', 'Giường nằm',  20),
('51B-333.33', 'Ghế ngồi',   16),
('51B-444.44', 'Giường nằm',  24),
('51B-555.55', 'Ghế ngồi',   12),
('30A-666.66', 'Giường nằm',  20),
('43B-777.77', 'Ghế ngồi',   16);

-- Trips (Chuyến đi mẫu - driver_name là text)
INSERT INTO trips (schedule_id, bus_id, driver_name, departure_date, available_seats, status) VALUES
(1,  1, 'Trần Văn Bình',   CURDATE() + INTERVAL 1 DAY, 16, 'SCHEDULED'),
(2,  2, 'Nguyễn Văn Cường', CURDATE() + INTERVAL 1 DAY, 20, 'SCHEDULED'),
(3,  3, 'Lê Minh Đức',     CURDATE() + INTERVAL 1 DAY, 16, 'SCHEDULED'),
(5,  4, 'Phạm Văn Em',     CURDATE() + INTERVAL 1 DAY, 24, 'SCHEDULED'),
(7,  5, 'Trần Văn Bình',   CURDATE() + INTERVAL 2 DAY, 12, 'SCHEDULED'),
(8,  1, 'Nguyễn Văn Cường', CURDATE() + INTERVAL 2 DAY, 16, 'SCHEDULED'),
(11, 3, 'Lê Minh Đức',     CURDATE() + INTERVAL 2 DAY, 16, 'SCHEDULED'),
(4,  2, 'Phạm Văn Em',     CURDATE() + INTERVAL 3 DAY, 20, 'SCHEDULED'),
(6,  4, 'Trần Văn Bình',   CURDATE() + INTERVAL 3 DAY, 24, 'SCHEDULED'),
(17, 6, 'Nguyễn Văn Cường', CURDATE() + INTERVAL 3 DAY, 20, 'SCHEDULED');
