import { createClient } from '@supabase/supabase-js';

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
  realtime: {
    enabled: false, // Disable realtime as we don't need subscriptions
  },
});

/**
 * Fetch all unique routes from the database
 * @returns {Promise<Array>} Array of route objects
 */
export const fetchRoutes = async () => {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('id, from_city, to_city')
      .order('from_city', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching routes:', error);
    throw error;
  }
};

/**
 * Fetch vehicles for a specific route with driver information
 * @param {string} routeId - The route ID to filter vehicles
 * @returns {Promise<Array>} Array of vehicle objects with driver data
 */
export const fetchVehiclesByRoute = async (routeId) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        vehicle_name,
        type,
        price,
        driver:driver_id (
          name,
          phone
        )
      `)
      .eq('route_id', routeId)
      .order('vehicle_name', { ascending: true });

    if (error) throw error;

    // Transform the data to flatten the driver object
    return (data || []).map(vehicle => ({
      id: vehicle.id,
      vehicle_name: vehicle.vehicle_name,
      type: vehicle.type,
      price: vehicle.price,
      driver_name: vehicle.driver?.name || 'N/A',
      driver_phone: vehicle.driver?.phone || null,
    }));
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};
