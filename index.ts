import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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

    // Строка о типе поездки
    const tripLine = tripType === 'pochta'
      ? '📦 Тури: Почта жеткизиу'
      : `🚕 Тури: Йўловчи — ${passengers} киши`;

    const message =
      `🔔 Янги заявка!\n\n` +
      `📍 Маршрут: ${fromCity} → ${toCity}\n` +
      `${tripLine}\n` +
      `📞 Телефон: ${phone}\n` +
      `👤 Фойдаланувчи: ${userInfo || "Номаълум"}\n` +
      `🕐 Вақт: ${new Date().toLocaleString("ru-RU")}`;

    const groupText = tripType === 'pochta'
      ? `🔔 Yangi buyurtma!\n\n📍 Marshrut: ${fromCity} → ${toCity}\n📦 Tur: Pochta jetkiziw\n📞 Telefon: ${phone}\n⏳ Status: kutilmoqda...`
      : `🔔 Yangi buyurtma!\n\n📍 Marshrut: ${fromCity} → ${toCity}\n🚕 Tur: Yolowshi — ${passengers} kishi\n📞 Telefon: ${phone}\n⏳ Status: kutilmoqda...`;

    const sends = [
      fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: OWNER_CHAT_ID, text: message }),
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

    await Promise.all(sends);

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
