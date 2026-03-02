import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN")!;
const OWNER_CHAT_ID = Deno.env.get("OWNER_CHAT_ID")!;
const DRIVER_GROUP_ID = Deno.env.get("DRIVER_GROUP_ID");
const MINI_APP_URL = "https://telegram-routes.vercel.app/";

// Supabase с service_role — чтобы обходить RLS при UPDATE
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://telegram-routes.vercel.app",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const body = await req.json();

  // ---- ЗАЯВКА ОТ ФРОНТЕНДА ----
  if (body.action === "booking") {
    return await handleBooking(body);
  }

  const update = body;

  // ---- ВОДИТЕЛЬ НАЖАЛ "OLISH" ----
  if (update.callback_query) {
    const query = update.callback_query;

    if (query.data?.startsWith("take|")) {
      const [, bookingId] = query.data.split("|");
      const driverUsername = query.from.username
        ? `@${query.from.username}`
        : query.from.first_name || "Haydovchi";

      // Атомарный UPDATE: только один водитель пройдёт условие status='new'
      const { data: booking, error } = await supabase
        .from("bookings")
        .update({ status: "taken", driver_username: driverUsername })
        .eq("id", bookingId)
        .eq("status", "new")
        .select("phone, from_city, to_city")
        .single();

      if (error || !booking) {
        // Заявка уже взята — сообщаем водителю
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: query.id,
            text: "❌ Buyurtma allaqachon boshqa haydovchi tomonidan olindi!",
            show_alert: true,
          }),
        });
        return new Response("ok");
      }

      // Успешно захватили — обновляем сообщение и показываем телефон
      await Promise.all([
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            text: `✅ Buyurtma olindi!\n\n📍 Marshrut: ${booking.from_city} → ${booking.to_city}\n🚕 Haydovchi: ${driverUsername}`,
          }),
        }),
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: query.id,
            text: `Buyurtma sizga biriktirildi! 📞 ${booking.phone}`,
            show_alert: true,
          }),
        }),
      ]);
    }

    return new Response("ok");
  }

  // ---- БОТ ДОБАВЛЕН В ГРУППУ ----
  if (update.my_chat_member) {
    const chat = update.my_chat_member.chat;
    const newStatus = update.my_chat_member.new_chat_member.status;
    if (newStatus === "member" || newStatus === "administrator") {
      await sendGroupMessage(chat.id);
    }
    return new Response("ok");
  }

  // ---- ОБЫЧНОЕ СООБЩЕНИЕ ----
  if (!update.message) return new Response("ok");

  const chatId = update.message.chat.id;
  const text = update.message.text;

  if (text === "/start") await sendPrivateMessage(chatId);
  if (text === "/app") await sendGroupMessage(chatId);

  return new Response("ok");
});

// ---- ОБРАБОТЧИК ЗАЯВКИ ОТ ФРОНТЕНДА ----
async function handleBooking(body: {
  phone: string;
  fromCity: string;
  toCity: string;
  telegramUserId?: number | null;
  telegramUsername?: string | null;
  bookingType?: string;
  passengers?: number | null;
}) {
  const { phone, fromCity, toCity, telegramUserId, telegramUsername, bookingType = 'taxi', passengers } = body;

  // 1. Сначала INSERT — если упал, возвращаем ошибку клиенту
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert([{
      phone,
      from_city: fromCity,
      to_city: toCity,
      telegram_user_id: telegramUserId || null,
      telegram_username: telegramUsername || null,
      status: "new",
    }])
    .select("id")
    .single();

  if (error || !booking) {
    console.error("DB insert error:", error);
    return new Response(JSON.stringify({ error: "Saqlashda xatolik" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const bookingId = booking.id; // UUID, используем в callback_data
  const userInfo = telegramUsername
    ? `@${telegramUsername}`
    : telegramUserId
    ? `ID: ${telegramUserId}`
    : "Номаълум";

  const ownerMessage =
    `🔔 Янги заявка!\n\n` +
    `📍 Маршрут: ${fromCity} → ${toCity}\n` +
    `📞 Телефон: ${phone}\n` +
    `👤 Фойдаланувчи: ${userInfo}\n` +
    `🕐 Вақт: ${new Date().toLocaleString("ru-RU")}`;

  // 2. Уведомления — параллельно, ошибки не критичны
  const notifications: Promise<unknown>[] = [
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: OWNER_CHAT_ID, text: ownerMessage }),
    }),
  ];

  if (DRIVER_GROUP_ID) {
    notifications.push(
      fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: DRIVER_GROUP_ID,
          text: `🔔 Yangi buyurtma!\n\n📍 Marshrut: ${fromCity} → ${toCity}\n⏳ Status: kutilmoqda...`,
          reply_markup: {
            inline_keyboard: [[
              // Только ID заявки — телефон не светим, и укладываемся в 64 байта
              { text: "✅ Olish", callback_data: `take|${bookingId}` },
            ]],
          },
        }),
      })
    );
  }

  await Promise.allSettled(notifications);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---- ФУНКЦИИ ОТПРАВКИ ----
async function sendPrivateMessage(chatId: number) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `Assalawma Aleykum\nBotimizğa xosh kelipsiz 😊\nSiz botimizda Rayonlarğa taksilerdi ham Nokis qalasindaği juk mashinlarin taba alasiz\nSTARTti basiñ ⏬`,
      reply_markup: {
        inline_keyboard: [[{ text: "🚕 START", web_app: { url: MINI_APP_URL } }]],
      },
    }),
  });
}

async function sendGroupMessage(chatId: number) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `Taksi 🚕 Xizmetleri Usi Jerde!\nAssalawma Aleykum\nQaraqalpaqstandagi rayonlarga añsat ham tez taksi xizmeti\nGruppalarga kirip juriw shart emes. Hammesi bir Botta ✅`,
      reply_markup: {
        inline_keyboard: [[{ text: "🚕 TAKSI", url: MINI_APP_URL }]],
      },
    }),
  });
}
