import { createClient } from '@supabase/supabase-js';
/**
 * Retry function with exponential backoff
 * Помогает при временных проблемах с сетью или rate limits
 */
const fetchWithRetry = async (fn, retries = 2, delay = 300) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
  if (
    error?.status &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 429
  ) {
    throw error;
  }

  if (i === retries - 1) throw error;

  const waitTime = delay * Math.pow(2, i);
  await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Supabase configuration - these will be set in .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with read-only configuration
// This uses the public anon key which should have RLS policies limiting to SELECT only
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Fetch all unique routes from the database
 * @returns {Promise<Array>} Array of route objects
 */
export const fetchRoutes = async () => {
  return fetchWithRetry(async () => {
    const { data, error } = await supabase
      .from('routes')
      .select('id, from_city, to_city');

    if (error) throw error;
    return data || [];
  });
};

/**
 * Fetch vehicles for a specific route with driver information
 * @param {string} routeId - The route ID to filter vehicles
 * @returns {Promise<Array>} Array of vehicle objects with driver data
 */
export const fetchVehiclesByRoute = async (routeId) => {
  return fetchWithRetry(async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        vehicle_name,
        driver:driver_id (
          name,
          phone
        )
      `)
      .eq('route_id', routeId)
.limit(50);

    if (error) throw error;

    // Transform the data to flatten the driver object
    return (data || []).map(vehicle => ({
      id: vehicle.id,
      vehicle_name: vehicle.vehicle_name,
      driver_name: vehicle.driver?.name || 'N/A',
      driver_phone: vehicle.driver?.phone || null,
    }));
  });
};

export const fetchDeliveryVehicles = async () => {
  return fetchWithRetry(async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        vehicle_name,
        driver:driver_id (
          name,
          phone
        )
      `)
      .eq('type', 'delivery')
      .limit(50);

    if (error) throw error;

    return (data || []).map(vehicle => ({
      id: vehicle.id,
      vehicle_name: vehicle.vehicle_name,
      driver_name: vehicle.driver?.name || 'N/A',
      driver_phone: vehicle.driver?.phone || null,
    }));
  });
};

const COOLDOWN_MS = 10_000; // 10 секунд — только защита от двойного клика

export const submitBooking = async ({ phone, fromCity, toCity, telegramUserId, telegramUsername }) => {
  const lastKey = `last_booking_${fromCity}_${toCity}`;
  const lastTs = localStorage.getItem(lastKey);
  if (lastTs && Date.now() - Number(lastTs) < COOLDOWN_MS) {
    throw new Error(`Buyurtma yuborildi, iltimos kuting...`);
  }

  const edgeUrl = import.meta.env.VITE_EDGE_FUNCTION_URL;

  const res = await fetch(edgeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'booking',
      phone,
      fromCity,
      toCity,
      telegramUserId: telegramUserId || null,
      telegramUsername: telegramUsername || null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Server xatoligi');
  }

  // Сохраняем время успешной заявки
  localStorage.setItem(lastKey, String(Date.now()));
  return true;
};
