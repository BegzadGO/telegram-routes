import { createClient } from '@supabase/supabase-js';

const fetchWithRetry = async (fn, retries = 2, delay = 300) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error?.status && error.status >= 400 && error.status < 500 && error.status !== 429) throw error;
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const fetchRoutes = async () => {
  return fetchWithRetry(async () => {
    const { data, error } = await supabase
      .from('routes')
      .select('id, from_city, to_city, price');
    if (error) throw error;
    return data || [];
  });
};

export const fetchDeliveryVehicles = async () => {
  return fetchWithRetry(async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`id, vehicle_name, driver:driver_id (name, phone)`)
      .eq('type', 'delivery')
      .limit(50);
    if (error) throw error;
    return (data || []).map(v => ({
      id: v.id,
      vehicle_name: v.vehicle_name,
      driver_name:  v.driver?.name  || null,
      driver_phone: v.driver?.phone || null,
    }));
  });
};

const COOLDOWN_MS = 10_000;

// Кастомная ошибка для рабочих часов
export class WorkingHoursError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WorkingHoursError';
  }
}

export const submitBooking = async ({
  phone, fromCity, toCity,
  telegramUserId, telegramUsername,
  bookingType = 'taxi', passengers = null,
}) => {
  const lastKey = `last_booking_${fromCity}_${toCity}`;
  const lastTs  = localStorage.getItem(lastKey);
  if (lastTs && Date.now() - Number(lastTs) < COOLDOWN_MS) {
    throw new Error('Заявка жиберилди, кутиңиз...');
  }

  const edgeUrl = import.meta.env.VITE_EDGE_FUNCTION_URL;
  const res = await fetch(edgeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'booking',
      phone, fromCity, toCity,
      telegramUserId:   telegramUserId   || null,
      telegramUsername: telegramUsername || null,
      bookingType, passengers,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Рабочие часы — отдельный класс ошибки для UI
    if (err.error === 'working_hours') throw new WorkingHoursError(err.message);
    throw new Error(err.error || 'Сервер қатесі');
  }

  localStorage.setItem(lastKey, String(Date.now()));
  return true;
};
