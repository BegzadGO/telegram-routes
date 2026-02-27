import { createClient } from '@supabase/supabase-js';

// ──────────────────────────────────────────────────
// RETRY — повтор при сетевых ошибках
// ──────────────────────────────────────────────────
const fetchWithRetry = async (fn, retries = 2, delay = 300) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      // 4xx ошибки (кроме 429) не повторяем — они не исправятся сами
      if (error?.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

// ──────────────────────────────────────────────────
// SUPABASE КЛИЕНТ
// ──────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Отсутствуют переменные окружения Supabase. Проверьте файл .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// ──────────────────────────────────────────────────
// МАРШРУТЫ
// ──────────────────────────────────────────────────
export const fetchRoutes = async () => {
  return fetchWithRetry(async () => {
    const { data, error } = await supabase
      .from('routes')
      .select('id, from_city, to_city');
    if (error) throw error;
    return data || [];
  });
};

// ──────────────────────────────────────────────────
// МАШИНЫ ДОСТАВКИ
// ──────────────────────────────────────────────────
export const fetchDeliveryVehicles = async () => {
  return fetchWithRetry(async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        vehicle_name,
        driver:driver_id (
          name
        )
      `)
      .eq('type', 'delivery')
      .limit(50);
    if (error) throw error;
    return (data || []).map(vehicle => ({
      id: vehicle.id,
      vehicle_name: vehicle.vehicle_name,
      driver_name: vehicle.driver?.name || 'N/A',
    }));
  });
};

// ──────────────────────────────────────────────────
// ЗАЩИТА ОТ СПАМА: не чаще 1 заявки в 60 секунд
// ──────────────────────────────────────────────────
const BOOKING_COOLDOWN_MS = 60 * 1000;
const BOOKING_COOLDOWN_KEY = 'last_booking_ts';

// ──────────────────────────────────────────────────
// ОТПРАВКА ЗАЯВКИ
// ──────────────────────────────────────────────────
export const submitBooking = async ({
  phone,
  tripType,
  passengers,
  fromCity,
  toCity,
  telegramUserId,
  telegramUsername,
}) => {
  // Проверяем cooldown — не чаще 1 раза в минуту
  const lastBookingTs = parseInt(localStorage.getItem(BOOKING_COOLDOWN_KEY) || '0', 10);
  if (Date.now() - lastBookingTs < BOOKING_COOLDOWN_MS) {
    const secondsLeft = Math.ceil((BOOKING_COOLDOWN_MS - (Date.now() - lastBookingTs)) / 1000);
    throw new Error(`Биразга кутинг, ${secondsLeft} секунддан кейин уриниб кўринг`);
  }

  // ШАГ 1: Сохраняем заявку и получаем её ID
  const { data: bookingData, error: dbError } = await supabase
    .from('bookings')
    .insert([{
      phone,
      trip_type: tripType,
      passengers: passengers || null,
      from_city: fromCity,
      to_city: toCity,
      telegram_user_id: telegramUserId || null,
      telegram_username: telegramUsername || null,
      status: 'new',
      created_at: new Date().toISOString(),
    }])
    .select('id')
    .single();

  if (dbError) throw new Error(`Ошибка сохранения заявки: ${dbError.message}`);

  // Запоминаем время успешной отправки
  localStorage.setItem(BOOKING_COOLDOWN_KEY, String(Date.now()));

  // ШАГ 2: Отправляем уведомление через Edge Function
  // Передаём bookingId — не телефон в открытом виде
  try {
    await supabase.functions.invoke('send-notification', {
      body: {
        bookingId: bookingData.id,
        phone,
        tripType,
        passengers,
        fromCity,
        toCity,
        userInfo: telegramUsername
          ? `@${telegramUsername}`
          : telegramUserId
          ? `ID: ${telegramUserId}`
          : 'Номаълум',
      },
    });
  } catch (notifyErr) {
    // Уведомление не критично — заявка уже сохранена
    console.warn('Telegram уведомление не отправлено:', notifyErr.message);
  }

  return true;
};
