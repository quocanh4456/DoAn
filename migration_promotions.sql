-- =====================================================
-- Migration: Thêm bảng promotions + cột promo vào tickets
-- Chạy file này trên database vinacoach
-- =====================================================

USE vinacoach;

-- 1. Tạo bảng promotions
CREATE TABLE IF NOT EXISTS promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    discount_percent INT NOT NULL,
    max_discount DECIMAL(12,0) DEFAULT 0,
    max_usage INT DEFAULT 0,
    used_count INT DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Thêm cột promo vào bảng tickets
ALTER TABLE tickets
  ADD COLUMN promo_code VARCHAR(30) NULL,
  ADD COLUMN discount_amount DECIMAL(12,0) DEFAULT 0;

-- 3. Seed data: 3 mã khuyến mãi mẫu
INSERT INTO promotions (code, description, discount_percent, max_discount, max_usage, start_date, end_date) VALUES
('NEWUSER20', 'Giảm 20% cho chuyến đầu tiên',  20, 100000, 0, '2026-01-01', '2026-12-31'),
('COMBO2VE',  'Combo 2 vé tiết kiệm',           10, 0,      0, '2026-01-01', '2026-06-30'),
('THU3VUI',   'Thứ 3 giảm 15% mọi tuyến',      15, 80000,  0, '2026-01-01', '2026-12-31');
