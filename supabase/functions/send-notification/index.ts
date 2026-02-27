import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://telegram-routes.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
    const OWNER_CHAT_ID = Deno.env.get("OWNER_CHAT_ID");
    const DRIVER_GROUP_ID = Deno.env.get("DRIVER_GROUP_ID");

    if (!BOT_TOKEN || !OWNER_CHAT_ID) {
      return new Response(
        JSON.stringify({ error: "Server secrets not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { phone, tripType, passengers, fromCity, toCity, userInfo } = await req.json();

    if (!phone || !fromCity || !toCity) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Валидация телефона на сервере
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Сообщение владельцу
    const tripLine = tripType === "pochta"
      ? "📦 Тури: Почта жеткизиу"
      : `🚕 Тури: Йўловчи — ${passengers} киши`;

    const ownerMessage =
      `🔔 Янги заявка!\n\n` +
      `📍 Маршрут: ${fromCity} → ${toCity}\n` +
      `${tripLine}\n` +
      `📞 Телефон: ${phone}\n` +
      `👤 Фойдаланувчи: ${userInfo || "Номаълум"}\n` +
      `🕐 Вақт: ${new Date().toLocaleString("ru-RU")}`;

    // Сообщение в группу водителей
    const groupText = tripType === "pochta"
      ? `🔔 Yangi buyurtma!\n\n📍 Marshrut: ${fromCity} → ${toCity}\n📦 Tur: Pochta jetkiziw\n📞 Telefon: ${phone}\n⏳ Status: kutilmoqda...`
      : `🔔 Yangi buyurtma!\n\n📍 Marshrut: ${fromCity} → ${toCity}\n🚕 Tur: Yolowshi — ${passengers} kishi\n📞 Telefon: ${phone}\n⏳ Status: kutilmoqda...`;

    const sends = [
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
                { text: "✅ Olish", callback_data: `take|${phone}|${fromCity}|${toCity}` },
              ]],
            },
          }),
        })
      );
    }

    // Отправляем и проверяем ответы
    const results = await Promise.allSettled(sends);
    for (const result of results) {
      if (result.status === "fulfilled") {
        const tgJson = await result.value.json();
        if (!tgJson.ok) {
          console.error("Telegram API error:", tgJson.description);
        }
      } else {
        console.error("Network error:", result.reason);
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("send-notification error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

