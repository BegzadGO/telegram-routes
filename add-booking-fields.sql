-- Запустите в Supabase → SQL Editor → New query
-- Добавляет два новых поля в таблицу bookings

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS trip_type TEXT,       -- 'passenger' или 'pochta'
  ADD COLUMN IF NOT EXISTS passengers INTEGER;    -- 1, 2, 3 или 4 (NULL если почта)
