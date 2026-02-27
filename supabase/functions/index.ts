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

    const { phone, fromCity, toCity, userInfo } = await req.json();

    if (!phone || !fromCity || !toCity) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message =
      `🔔 Янги заявка!\n\n` +
      `📍 Маршрут: ${fromCity} → ${toCity}\n` +
      `📞 Телефон: ${phone}\n` +
      `👤 Фойдаланувчи: ${userInfo || "Номаълум"}\n` +
      `🕐 Вақт: ${new Date().toLocaleString("ru-RU")}`;

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
            text: `🔔 Yangi buyurtma!\n\n📍 Marshrut: ${fromCity} → ${toCity}\n📞 Telefon: ${phone}\n⏳ Status: kutilmoqda...`,
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
