-- ============================================
-- Такси 95 — Database Schema
-- ============================================

-- Водителлар
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT
);

-- Маршрутлар
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_city TEXT,
  to_city TEXT
);

CREATE INDEX IF NOT EXISTS idx_routes_cities ON public.routes (from_city, to_city);

-- Машиналар
-- type: 'delivery' — жук машиналары, NULL — такси маршрути бойинша
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_name TEXT,
  type TEXT
);

CREATE INDEX IF NOT EXISTS idx_vehicles_route_id ON public.vehicles (route_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON public.vehicles (driver_id);

-- Пайдаланыушылар (ботты іске қосқанлар)
CREATE TABLE IF NOT EXISTS public.users (
  chat_id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now()
);

-- Заявкалар
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  telegram_user_id BIGINT,
  telegram_username TEXT,
  status TEXT DEFAULT 'new',       -- 'new' | 'taken'
  driver_username TEXT,            -- заявканы алған водитель
  booking_type TEXT DEFAULT 'taxi', -- 'taxi' | 'cargo'
  passengers INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE public.routes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Маршрутлар, водителлар, машиналар — анонимге тек оқыу
DROP POLICY IF EXISTS "anon_read_routes"   ON public.routes;
DROP POLICY IF EXISTS "anon_read_drivers"  ON public.drivers;
DROP POLICY IF EXISTS "anon_read_vehicles" ON public.vehicles;

CREATE POLICY "anon_read_routes"
  ON public.routes FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_drivers"
  ON public.drivers FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_vehicles"
  ON public.vehicles FOR SELECT TO anon USING (true);

-- bookings ҳәм users — тек service_role (Edge Function) жаза алады
-- Анонимге рұқсат жоқ — бул Edge Function арқылы өтеди
