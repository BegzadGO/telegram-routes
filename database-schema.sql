-- ============================================
-- Telegram Route Finder - Database Schema
-- ============================================
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Routes table: stores available routes between cities
CREATE TABLE IF NOT EXISTS routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table: stores driver information
CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table: stores vehicles assigned to routes
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_vehicles_route_id ON vehicles(route_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_routes_cities ON routes(from_city, to_city);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES (READ-ONLY ACCESS)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access on routes" ON routes;
DROP POLICY IF EXISTS "Allow public read access on drivers" ON drivers;
DROP POLICY IF EXISTS "Allow public read access on vehicles" ON vehicles;

-- Create new read-only policies for anonymous users
CREATE POLICY "Allow public read access on routes"
  ON routes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access on drivers"
  ON drivers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access on vehicles"
  ON vehicles FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- 5. INSERT SAMPLE DATA (Optional)
-- ============================================

-- Insert sample routes
INSERT INTO routes (from_city, to_city) VALUES
  ('New York', 'Boston'),
  ('New York', 'Philadelphia'),
  ('New York', 'Washington DC'),
  ('Boston', 'New York'),
  ('Boston', 'Providence'),
  ('Philadelphia', 'New York'),
  ('Los Angeles', 'San Francisco'),
  ('Los Angeles', 'San Diego'),
  ('San Francisco', 'Los Angeles'),
  ('Chicago', 'Milwaukee'),
  ('Chicago', 'Detroit'),
  ('Miami', 'Orlando'),
  ('Orlando', 'Miami'),
  ('Seattle', 'Portland'),
  ('Portland', 'Seattle')
ON CONFLICT DO NOTHING;

-- Insert sample drivers
INSERT INTO drivers (name, phone) VALUES
  ('John Smith', '+1-555-0101'),
  ('Maria Garcia', '+1-555-0102'),
  ('David Lee', '+1-555-0103'),
  ('Sarah Johnson', '+1-555-0104'),
  ('Michael Brown', '+1-555-0105'),
  ('Emily Davis', '+1-555-0106'),
  ('James Wilson', '+1-555-0107'),
  ('Lisa Anderson', '+1-555-0108'),
  ('Robert Taylor', '+1-555-0109'),
  ('Jennifer Martinez', '+1-555-0110')
ON CONFLICT DO NOTHING;

-- Insert sample vehicles for New York → Boston route
INSERT INTO vehicles (route_id, driver_id, vehicle_name, type, price)
SELECT 
  r.id,
  d.id,
  v.vehicle_name,
  v.type,
  v.price
FROM routes r
CROSS JOIN (
  SELECT unnest(ARRAY['John Smith', 'Maria Garcia', 'David Lee']) as name
) driver_names
JOIN drivers d ON d.name = driver_names.name
CROSS JOIN (VALUES
  ('Comfort Express', 'bus', 45),
  ('Quick Ride', 'car', 60),
  ('Family Van', 'minivan', 55)
) v(vehicle_name, type, price)
WHERE r.from_city = 'New York' AND r.to_city = 'Boston'
ON CONFLICT DO NOTHING;

-- Insert sample vehicles for Los Angeles → San Francisco route
INSERT INTO vehicles (route_id, driver_id, vehicle_name, type, price)
SELECT 
  r.id,
  d.id,
  v.vehicle_name,
  v.type,
  v.price
FROM routes r
CROSS JOIN (
  SELECT unnest(ARRAY['Sarah Johnson', 'Michael Brown']) as name
) driver_names
JOIN drivers d ON d.name = driver_names.name
CROSS JOIN (VALUES
  ('Coast Cruiser', 'bus', 50),
  ('Pacific Ride', 'car', 70)
) v(vehicle_name, type, price)
WHERE r.from_city = 'Los Angeles' AND r.to_city = 'San Francisco'
ON CONFLICT DO NOTHING;

-- Insert sample vehicles for Chicago → Milwaukee route
INSERT INTO vehicles (route_id, driver_id, vehicle_name, type, price)
SELECT 
  r.id,
  d.id,
  v.vehicle_name,
  v.type,
  v.price
FROM routes r
CROSS JOIN (
  SELECT unnest(ARRAY['Emily Davis', 'James Wilson']) as name
) driver_names
JOIN drivers d ON d.name = driver_names.name
CROSS JOIN (VALUES
  ('Midwest Express', 'bus', 35),
  ('Lakeshore Drive', 'minivan', 40)
) v(vehicle_name, type, price)
WHERE r.from_city = 'Chicago' AND r.to_city = 'Milwaukee'
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

-- Verify table counts
SELECT 'routes' as table_name, COUNT(*) as count FROM routes
UNION ALL
SELECT 'drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('routes', 'drivers', 'vehicles');

-- Verify policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('routes', 'drivers', 'vehicles');

-- Test query: Get all vehicles for a route (example)
SELECT 
  v.vehicle_name,
  v.type,
  v.price,
  d.name as driver_name,
  d.phone as driver_phone,
  r.from_city,
  r.to_city
FROM vehicles v
JOIN drivers d ON v.driver_id = d.id
JOIN routes r ON v.route_id = r.id
WHERE r.from_city = 'New York' 
  AND r.to_city = 'Boston';

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Your database is now ready for the Telegram Mini App
-- 
-- Next steps:
-- 1. Copy your Supabase URL and anon key
-- 2. Add them to your .env file
-- 3. Deploy to Vercel
-- 4. Register with Telegram BotFather
-- ============================================
