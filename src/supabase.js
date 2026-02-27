import { createClient } from '@supabase/supabase-js';

const fetchWithRetry = async (fn, retries = 2, delay = 300) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error?.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

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

export const fetchRoutes = async () => {
  return fetchWithRetry(async () => {
    const { data, error } = await supabase
      .from('routes')
      .select('id, from_city, to_city');
    if (error) throw error;
    return data || [];
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

export const submitBooking = async ({ phone, fromCity, toCity, telegramUserId, telegramUsername }) => {
  // ШАГ 1: Сохраняем в базу — если ошибка, выбрасываем её (не глотаем)
  const { error: dbError } = await supabase.from('bookings').insert([{
    phone,
    from_city: fromCity,
    to_city: toCity,
    telegram_user_id: telegramUserId || null,
    telegram_username: telegramUsername || null,
    status: 'new',
    created_at: new Date().toISOString(),
  }]);

  if (dbError) throw new Error(`Ошибка сохранения заявки: ${dbError.message}`);

  // ШАГ 2: Отправляем уведомление через Edge Function (токен бота только там)
  // Если уведомление не дошло — заявка всё равно сохранена, это некритично
  try {
    await supabase.functions.invoke('send-notification', {
      body: {
        phone,
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
    console.warn('Telegram уведомление не отправлено:', notifyErr.message);
  }

  return true;
};
