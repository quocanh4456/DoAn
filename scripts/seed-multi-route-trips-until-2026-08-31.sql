-- Seed trips for all active schedules until 2026-08-31
-- Compatible with MariaDB versions without CTE INSERT support
-- Safe to re-run: skips existing rows by (schedule_id, departure_date)

SET @start_date := CURDATE();
SET @end_date := DATE('2026-08-31');
SET @days := DATEDIFF(@end_date, @start_date);

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
  AND t.id IS NULL;

