-- ============================================
-- Такси 95 — Migration
-- Supabase Dashboard > SQL Editor де ишлет
-- ============================================

-- 1. Маршрутларга баҳа қосу
ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;

-- 2. Заявкаларга рейтинг қосу
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS rating INTEGER;
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ;

-- 3. Админ панель ушын RLS — аутентификацияланған пайдаланыушы маршрутларды өзгерте алады
CREATE POLICY IF NOT EXISTS "auth_all_routes"
  ON public.routes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Бул жерде маршрутларга баҳа қойыу мысалы:
-- UPDATE public.routes SET price = 50000
--   WHERE from_city = 'Нөкис' AND to_city = 'Бердақ';
-- ============================================
