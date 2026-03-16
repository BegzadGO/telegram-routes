import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN")!;
const OWNER_CHAT_ID = Deno.env.get("OWNER_CHAT_ID")!;
const DRIVER_GROUP_ID = Deno.env.get("DRIVER_GROUP_ID");
const MINI_APP_URL = "https://telegram-routes.vercel.app/";

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

      const { data: booking, error } = await supabase
        .from("bookings")
        .update({ status: "taken", driver_username: driverUsername })
        .eq("id", bookingId)
        .eq("status", "new")
        .select("phone, from_city, to_city")
        .single();

      if (error || !booking) {
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
  const text = update.message.text || "";

  // ---- /start — сохраняем пользователя ----
  if (text === "/start") {
    await supabase.from("users").upsert({
      chat_id: chatId,
      username: update.message.from?.username || null,
      first_name: update.message.from?.first_name || null,
      last_seen: new Date().toISOString(),
    }, { onConflict: "chat_id" });

    await sendPrivateMessage(chatId);
  }

  if (text === "/app") await sendGroupMessage(chatId);

  // ---- ТОЛЬКО ВЛАДЕЛЕЦ МОЖЕТ ДЕЛАТЬ РАССЫЛКУ ----
  const isOwner = String(chatId) === String(OWNER_CHAT_ID);

  if (isOwner) {

    // /stats — посмотреть сколько пользователей
    if (text === "/stats") {
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `📊 Botingizda jami: *${count}* ta foydalanuvchi bor`,
          parse_mode: "Markdown",
        }),
      });
    }

    // /xabar Матн — рассылка текстового сообщения всем
    // Пример: /xabar Assalomu alaykum! Yangi narxlar!
    if (text.startsWith("/xabar ")) {
      const messageText = text.replace("/xabar ", "").trim();
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `⏳ Xabar yuborilmoqda...`,
        }),
      });
      const result = await broadcastText(messageText);
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ Yuborildi: ${result.sent} ta\n❌ Xato: ${result.failed} ta`,
        }),
      });
    }

    // /rasm LINK Yozuv — рассылка фото с подписью всем
    // Пример: /rasm https://i.imgur.com/abc.jpg Bu yangi aksiya!
    if (text.startsWith("/rasm ")) {
      const parts = text.replace("/rasm ", "").trim().split(" ");
      const photoUrl = parts[0];
      const caption = parts.slice(1).join(" ") || "";

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `⏳ Rasm yuborilmoqda...`,
        }),
      });
      const result = await broadcastPhoto(photoUrl, caption);
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ Yuborildi: ${result.sent} ta\n❌ Xato: ${result.failed} ta`,
        }),
      });
    }

    // /yordam — список команд владельца
    if (text === "/yordam") {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          parse_mode: "Markdown",
          text:
            `*Admin buyruqlari:*\n\n` +
            `📊 /stats — foydalanuvchilar soni\n\n` +
            `✉️ /xabar *Matn* — hammaga xabar yuborish\n` +
            `_Misol: /xabar Salom! Yangilik bor!_\n\n` +
            `🖼 /rasm *LINK Yozuv* — hammaga rasm yuborish\n` +
            `_Misol: /rasm https://i.imgur.com/abc.jpg Yangi aksiya!_`,
        }),
      });
    }
  }

  return new Response("ok");
});

// ---- РАССЫЛКА ТЕКСТА ----
async function broadcastText(message: string) {
  const { data: users } = await supabase.from("users").select("chat_id");
  let sent = 0, failed = 0;
  for (const user of users || []) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: user.chat_id, text: message }),
      });
      const json = await res.json();
      if (json.ok) sent++; else failed++;
    } catch { failed++; }
    await new Promise(r => setTimeout(r, 50));
  }
  return { sent, failed };
}

// ---- РАССЫЛКА ФОТО ----
async function broadcastPhoto(photoUrl: string, caption: string) {
  const { data: users } = await supabase.from("users").select("chat_id");
  let sent = 0, failed = 0;
  for (const user of users || []) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: user.chat_id, photo: photoUrl, caption }),
      });
      const json = await res.json();
      if (json.ok) sent++; else failed++;
    } catch { failed++; }
    await new Promise(r => setTimeout(r, 50));
  }
  return { sent, failed };
}

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

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert([{
      phone,
      from_city: fromCity,
      to_city: toCity,
      telegram_user_id: telegramUserId || null,
      telegram_username: telegramUsername || null,
      status: "new",
      booking_type: bookingType,
      passengers: passengers || null,
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

  const bookingId = booking.id;
  const userInfo = telegramUsername
    ? `@${telegramUsername}`
    : telegramUserId
    ? `ID: ${telegramUserId}`
    : "Номаълум";

  const typeLabel = bookingType === 'cargo'
    ? "📦 Pochta / Juk"
    : `🚕 Taksi (${passengers} yo'lovchi)`;

  const ownerMessage =
    `🔔 Янги заявка!\n\n` +
    `📍 Маршрут: ${fromCity} → ${toCity}\n` +
    `🚗 Тур: ${typeLabel}\n` +
    `📞 Телефон: ${phone}\n` +
    `👤 Фойдаланувчи: ${userInfo}\n` +
    `🕐 Вақт: ${new Date().toLocaleString("ru-RU")}`;

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
          text: `🔔 Yangi buyurtma!\n\n📍 Marshrut: ${fromCity} → ${toCity}\n🚗 Tur: ${typeLabel}\n⏳ Status: kutilmoqda...`,
          reply_markup: {
            inline_keyboard: [[
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

// ---- ПРИВЕТСТВЕННОЕ СООБЩЕНИЕ ----
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
