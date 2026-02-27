import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ✅ CORS — только ваш домен на Vercel
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://telegram-routes.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Preflight запрос от браузера
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ✅ ШАГ 1: Читаем секреты из окружения
    const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
    const OWNER_CHAT_ID = Deno.env.get("OWNER_CHAT_ID");
    const DRIVER_GROUP_ID = Deno.env.get("DRIVER_GROUP_ID");

    if (!BOT_TOKEN || !OWNER_CHAT_ID) {
      return new Response(
        JSON.stringify({ error: "Server secrets not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ ШАГ 2: Читаем тело запроса
    const { bookingId, phone, tripType, passengers, fromCity, toCity, userInfo } = await req.json();

    // ✅ ШАГ 3: Базовая валидация полей
    if (!bookingId || !phone || !fromCity || !toCity) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ ШАГ 4: Валидация телефона на сервере (не только на клиенте)
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ ШАГ 5: Проверяем что заявка реально существует в БД
    // (защита от вызовов в обход приложения)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ ШАГ 6: Формируем сообщения
    const tripLine = tripType === "pochta"
      ? "📦 Тури: Почта жеткизиу"
      : `🚕 Тури: Йўловчи — ${passengers} киши`;

    // Сообщение владельцу (с ID заявки для отслеживания)
    const ownerMessage =
      `🔔 Янги заявка! #${bookingId}\n\n` +
      `📍 Маршрут: ${fromCity} → ${toCity}\n` +
      `${tripLine}\n` +
      `📞 Телефон: ${phone}\n` +
      `👤 Фойдаланувчи: ${userInfo || "Номаълум"}\n` +
      `🕐 Вақт: ${new Date().toLocaleString("ru-RU")}`;

    // Сообщение в группу водителей
    const groupText = tripType === "pochta"
      ? `🔔 Yangi buyurtma!\n\n📍 Marshrut: ${fromCity} → ${toCity}\n📦 Tur: Pochta jetkiziw\n📞 Telefon: ${phone}\n⏳ Status: kutilmoqda...`
      : `🔔 Yangi buyurtma!\n\n📍 Marshrut: ${fromCity} → ${toCity}\n🚕 Tur: Yolowshi — ${passengers} kishi\n📞 Telefon: ${phone}\n⏳ Status: kutilmoqda...`;

    // ✅ ШАГ 7: Отправляем сообщения и проверяем ответы
    const sends: Promise<Response>[] = [
      fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: OWNER_CHAT_ID, text: ownerMessage }),
      }),
    ];

    if (DRIVER_GROUP_ID) {
      sends.push(
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: DRIVER_GROUP_ID,
            text: groupText,
            reply_markup: {
              inline_keyboard: [[
                // ✅ ИСПРАВЛЕНО: передаём ID заявки, а не телефон
                { text: "✅ Olish", callback_data: `take|${bookingId}` },
              ]],
            },
          }),
        })
      );
    }

    const results = await Promise.allSettled(sends);

    // Логируем ошибки Telegram (не падаем из-за них)
    for (const result of results) {
      if (result.status === "fulfilled") {
        const tgJson = await result.value.json();
        if (!tgJson.ok) {
          console.error("Telegram API error:", tgJson.description);
        }
      } else {
        console.error("Network error sending to Telegram:", result.reason);
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    // ✅ Не раскрываем детали ошибки наружу
    console.error("send-notification error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
