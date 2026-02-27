-- Запустите это в Supabase → SQL Editor
-- Удаляет старую политику без защиты и добавляет новую с rate limit

DROP POLICY IF EXISTS "Allow anonymous insert" ON bookings;

CREATE POLICY "Allow anonymous insert with rate limit" ON bookings
  FOR INSERT TO anon
  WITH CHECK (
    telegram_user_id IS NULL
    OR (
      SELECT COUNT(*) FROM bookings
      WHERE telegram_user_id = NEW.telegram_user_id
        AND created_at > NOW() - INTERVAL '10 minutes'
    ) < 3
  );

-- Индекс для быстрой проверки лимита
CREATE INDEX IF NOT EXISTS idx_bookings_user_time
  ON bookings(telegram_user_id, created_at);
