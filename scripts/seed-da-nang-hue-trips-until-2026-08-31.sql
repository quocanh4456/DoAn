-- Seed many trips for route Da Nang -> Hue (route_id = 8)
-- Range: from 2026-04-24 to 2026-08-31
-- Compatible with older MariaDB (no CTE required)
-- Safe to re-run: skips rows that already exist by (schedule_id, departure_date)
--
-- How to use:
-- 1) Open phpMyAdmin SQL tab (database: vinacoach)
-- 2) Paste and run this script
-- 3) Verify: SELECT COUNT(*) FROM trips WHERE schedule_id IN (18, 19);

SET @start_date := DATE('2026-04-24');
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
  assigned.bus_id,
  assigned.driver_name,
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
  ON s.route_id = 8
 AND s.is_active = 1
JOIN (
  SELECT
    18 AS schedule_id,
    7 AS bus_id,
    'Nguyễn Văn Kha' AS driver_name
  UNION ALL
  SELECT
    19 AS schedule_id,
    6 AS bus_id,
    'Trần Minh Quân' AS driver_name
) assigned
  ON assigned.schedule_id = s.id
JOIN buses b
  ON b.id = assigned.bus_id
LEFT JOIN trips t
  ON t.schedule_id = s.id
 AND t.departure_date = DATE_ADD(@start_date, INTERVAL seq.n DAY)
WHERE seq.n BETWEEN 0 AND @days
  AND t.id IS NULL;
