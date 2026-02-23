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

/**
 * Submit a booking request
 * Saves to Supabase and sends Telegram notification to bot owner
 */
export const submitBooking = async ({ phone, fromCity, toCity, telegramUserId, telegramUsername }) => {
  const botToken = import.meta.env.VITE_BOT_TOKEN;
  const ownerChatId = import.meta.env.VITE_OWNER_CHAT_ID;

  const userInfo = telegramUsername
    ? `@${telegramUsername}`
    : telegramUserId
    ? `ID: ${telegramUserId}`
    : 'Номаълум';

  const message =
    `🔔 Янги заявка!\n\n` +
    `📍 Маршрут: ${fromCity} → ${toCity}\n` +
    `📞 Телефон: ${phone}\n` +
    `👤 Фойдаланувчи: ${userInfo}\n` +
    `🕐 Вақт: ${new Date().toLocaleString('ru-RU')}`;

  try {
    await supabase.from('bookings').insert([{
      phone,
      from_city: fromCity,
      to_city: toCity,
      telegram_user_id: telegramUserId || null,
      telegram_username: telegramUsername || null,
      status: 'new',
      created_at: new Date().toISOString(),
    }]);
  } catch (e) {
    console.warn('Supabase insert error:', e);
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ownerChatId,
        text: message,
      }),
    });
  } catch (e) {
    console.warn('Telegram error:', e);
  }

  const driverGroupId = import.meta.env.VITE_DRIVER_GROUP_ID;
  if (botToken && driverGroupId) {
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: driverGroupId,
          text: `🔔 Yangi buyurtma!\n\n📍 Marshrut: ${fromCity} → ${toCity}\n📞 Telefon: ${phone}\n⏳ Status: kutilmoqda...`,
          reply_markup: {
            inline_keyboard: [[
              { text: "✅ Olish", callback_data: `take|${phone}|${fromCity}|${toCity}` }
            ]]
          }
        }),
      });
    } catch (e) {
      console.warn('Group notification error:', e);
    }
  }

  return true;
};
