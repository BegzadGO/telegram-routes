-- Создать таблицу заявок
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  telegram_user_id BIGINT,
  telegram_username TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Разрешить вставку через anon key (Row Level Security)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON bookings
  FOR INSERT TO anon WITH CHECK (true);

-- Только владелец (через service_role) может читать
CREATE POLICY "Only service role can read" ON bookings
  FOR SELECT TO service_role USING (true);
