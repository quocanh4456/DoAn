-- Add new routes + schedules + trips until 2026-08-31
-- Safe to re-run:
-- 1) routes: insert only if origin/destination not exists
-- 2) schedules: insert only if route_id + departure_time not exists
-- 3) trips: insert only if schedule_id + departure_date not exists

SET @start_date := CURDATE();
SET @end_date := DATE('2026-08-31');
SET @days := DATEDIFF(@end_date, @start_date);

-- 1) Add new routes (new origins included: Huế, Cần Thơ, Nha Trang)
INSERT INTO routes (origin, destination, distance, base_price, is_active)
SELECT 'Huế', 'Đà Nẵng', 100, 120000, 1
WHERE NOT EXISTS (
  SELECT 1 FROM routes WHERE origin = 'Huế' AND destination = 'Đà Nẵng'
);

INSERT INTO routes (origin, destination, distance, base_price, is_active)
SELECT 'Cần Thơ', 'TP. Hồ Chí Minh', 170, 190000, 1
WHERE NOT EXISTS (
  SELECT 1 FROM routes WHERE origin = 'Cần Thơ' AND destination = 'TP. Hồ Chí Minh'
);

INSERT INTO routes (origin, destination, distance, base_price, is_active)
SELECT 'Nha Trang', 'TP. Hồ Chí Minh', 430, 320000, 1
WHERE NOT EXISTS (
  SELECT 1 FROM routes WHERE origin = 'Nha Trang' AND destination = 'TP. Hồ Chí Minh'
);

INSERT INTO routes (origin, destination, distance, base_price, is_active)
SELECT 'Đà Lạt', 'TP. Hồ Chí Minh', 310, 270000, 1
WHERE NOT EXISTS (
  SELECT 1 FROM routes WHERE origin = 'Đà Lạt' AND destination = 'TP. Hồ Chí Minh'
);

INSERT INTO routes (origin, destination, distance, base_price, is_active)
SELECT 'Hải Phòng', 'Hà Nội', 120, 130000, 1
WHERE NOT EXISTS (
  SELECT 1 FROM routes WHERE origin = 'Hải Phòng' AND destination = 'Hà Nội'
);

-- 2) Add schedules for those new routes
INSERT INTO schedules (route_id, departure_time, is_active)
SELECT r.id, t.departure_time, 1
FROM routes r
JOIN (
  SELECT 'Huế' AS origin, 'Đà Nẵng' AS destination, '07:00:00' AS departure_time
  UNION ALL SELECT 'Huế', 'Đà Nẵng', '14:00:00'
  UNION ALL SELECT 'Cần Thơ', 'TP. Hồ Chí Minh', '06:30:00'
  UNION ALL SELECT 'Cần Thơ', 'TP. Hồ Chí Minh', '15:00:00'
  UNION ALL SELECT 'Nha Trang', 'TP. Hồ Chí Minh', '07:30:00'
  UNION ALL SELECT 'Nha Trang', 'TP. Hồ Chí Minh', '21:00:00'
  UNION ALL SELECT 'Đà Lạt', 'TP. Hồ Chí Minh', '08:00:00'
  UNION ALL SELECT 'Đà Lạt', 'TP. Hồ Chí Minh', '20:30:00'
  UNION ALL SELECT 'Hải Phòng', 'Hà Nội', '06:00:00'
  UNION ALL SELECT 'Hải Phòng', 'Hà Nội', '17:30:00'
) t
  ON r.origin = t.origin
 AND r.destination = t.destination
LEFT JOIN schedules s
  ON s.route_id = r.id
 AND s.departure_time = t.departure_time
WHERE s.id IS NULL;

-- 3) Add trips for all newly added routes' schedules
INSERT INTO trips (
  schedule_id,
  bus_id,
  driver_name,
  departure_date,
  available_seats,
  status
)
SELECT
  s.id AS schedule_id,
  b.id AS bus_id,
  CASE MOD(s.id, 6)
    WHEN 0 THEN 'Trần Văn Bình'
    WHEN 1 THEN 'Nguyễn Văn Cường'
    WHEN 2 THEN 'Lê Minh Đức'
    WHEN 3 THEN 'Phạm Văn Em'
    WHEN 4 THEN 'Đoàn Quốc Khánh'
    ELSE 'Hoàng Minh Tâm'
  END AS driver_name,
  DATE_ADD(@start_date, INTERVAL seq.n DAY) AS departure_date,
  b.total_seats AS available_seats,
  'SCHEDULED' AS status
FROM (
  SELECT
    (ones.n + tens.n * 10 + hundreds.n * 100) AS n
  FROM
    (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) ones
  CROSS JOIN
    (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) tens
  CROSS JOIN
    (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2) hundreds
) seq
JOIN schedules s
  ON s.is_active = 1
JOIN routes r
  ON r.id = s.route_id
JOIN buses b
  ON b.is_active = 1
 AND b.id = CASE MOD(s.id, 7)
   WHEN 0 THEN 1
   WHEN 1 THEN 2
   WHEN 2 THEN 3
   WHEN 3 THEN 4
   WHEN 4 THEN 5
   WHEN 5 THEN 6
   ELSE 7
 END
LEFT JOIN trips t
  ON t.schedule_id = s.id
 AND t.departure_date = DATE_ADD(@start_date, INTERVAL seq.n DAY)
WHERE seq.n BETWEEN 0 AND @days
  AND r.origin IN ('Huế', 'Cần Thơ', 'Nha Trang', 'Đà Lạt', 'Hải Phòng')
  AND t.id IS NULL;

