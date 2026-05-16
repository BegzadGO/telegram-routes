import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN     = Deno.env.get("BOT_TOKEN")!;
const OWNER_CHAT_ID = Deno.env.get("OWNER_CHAT_ID")!;
const DRIVER_GROUP_ID = Deno.env.get("DRIVER_GROUP_ID");
const MINI_APP_URL  = "https://telegram-routes.vercel.app/";

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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("ok");
  }

  if (body.action === "booking") return await handleBooking(body);

  const update = body;

  // ---- CALLBACK QUERY (кнопкалар) ----
  if (update.callback_query) {
    const query = update.callback_query as Record<string, unknown>;
    const data  = query.data as string;

    // Водитель заявканы алды
    if (data?.startsWith("take|")) {
      const [, bookingId] = data.split("|");
      const from = query.from as Record<string, unknown>;
      const driverUsername = from.username
        ? `@${from.username}`
        : (from.first_name as string) || "Haydovchi";

      const { data: booking, error } = await supabase
        .from("bookings")
        .update({ status: "taken", driver_username: driverUsername })
        .eq("id", bookingId)
        .eq("status", "new")
        .select("phone, from_city, to_city, telegram_user_id")
        .single();

      if (error || !booking) {
        await tgPost("answerCallbackQuery", {
          callback_query_id: query.id,
          text: "❌ Buyurtma allaqachon boshqa haydovchi tomonidan olindi!",
          show_alert: true,
        });
        return new Response("ok");
      }

      const message = query.message as Record<string, unknown>;
      const chat    = message.chat as Record<string, unknown>;

      const notifications: Promise<unknown>[] = [
        tgPost("editMessageText", {
          chat_id: chat.id,
          message_id: message.message_id,
          text: `✅ Buyurtma olindi!\n\n📍 Marshrut: ${booking.from_city} → ${booking.to_city}\n🚕 Haydovchi: ${driverUsername}`,
        }),
        tgPost("answerCallbackQuery", {
          callback_query_id: query.id,
          text: `Buyurtma sizga biriktirildi! 📞 ${booking.phone}`,
          show_alert: true,
        }),
      ];

      // ---- Пайдаланыушыны хабарландырыу + баҳа беретуғын кнопкалар ----
      if (booking.telegram_user_id) {
        notifications.push(
          tgPost("sendMessage", {
            chat_id: booking.telegram_user_id,
            text:
              `✅ Сиздиң заявкаңыз қабыл алынды!\n\n` +
              `📍 Маршрут: ${booking.from_city} → ${booking.to_city}\n` +
              `🚕 Водитель: ${driverUsername}\n` +
              `📞 Телефон: ${booking.phone}\n\n` +
              `Жолыңыз болсын! Жеткен соң поездканы баҳалаңыз 👇`,
            reply_markup: {
              inline_keyboard: [[
                { text: "⭐",      callback_data: `rate|${bookingId}|1` },
                { text: "⭐⭐",    callback_data: `rate|${bookingId}|2` },
                { text: "⭐⭐⭐",  callback_data: `rate|${bookingId}|3` },
                { text: "⭐⭐⭐⭐", callback_data: `rate|${bookingId}|4` },
                { text: "⭐⭐⭐⭐⭐", callback_data: `rate|${bookingId}|5` },
              ]],
            },
          })
        );
      }

      await Promise.allSettled(notifications);
      return new Response("ok");
    }

    // ---- Пайдаланыушы поездканы баҳалады ----
    if (data?.startsWith("rate|")) {
      const [, bookingId, ratingStr] = data.split("|");
      const rating = parseInt(ratingStr);

      const { error } = await supabase
        .from("bookings")
        .update({ rating, rated_at: new Date().toISOString() })
        .eq("id", bookingId)
        .is("rating", null); // тек бир рет баҳалауға болады

      const stars = "⭐".repeat(rating);

      if (!error) {
        // Кнопкаларды жойыу
        const message = query.message as Record<string, unknown>;
        const chat    = message.chat as Record<string, unknown>;
        await Promise.allSettled([
          tgPost("answerCallbackQuery", {
            callback_query_id: query.id,
            text: `${stars} Рахмет! Баҳаңыз қабыл алынды.`,
            show_alert: false,
          }),
          tgPost("editMessageReplyMarkup", {
            chat_id: chat.id,
            message_id: message.message_id,
            reply_markup: { inline_keyboard: [] },
          }),
        ]);
      } else {
        await tgPost("answerCallbackQuery", {
          callback_query_id: query.id,
          text: "Сіз бул поездканы баҳаладыңыз.",
          show_alert: false,
        });
      }

      return new Response("ok");
    }

    // Белгисиз callback
    await tgPost("answerCallbackQuery", { callback_query_id: query.id });
    return new Response("ok");
  }

  // ---- БОТ ТОПҚА ҚОСЫЛДЫ ----
  if (update.my_chat_member) {
    const mcm       = update.my_chat_member as Record<string, unknown>;
    const chat      = mcm.chat as Record<string, unknown>;
    const newMember = mcm.new_chat_member as Record<string, unknown>;
    const status    = newMember.status as string;
    if (status === "member" || status === "administrator") {
      await sendGroupMessage(chat.id as number);
    }
    return new Response("ok");
  }

  // ---- ОБЫЧНОЕ СООБЩЕНИЕ ----
  if (!update.message) return new Response("ok");

  const msg    = update.message as Record<string, unknown>;
  const chatId = (msg.chat as Record<string, unknown>)?.id as number;
  if (!chatId) return new Response("ok");

  const text = (msg.text as string) || "";

  // /start
  if (text === "/start") {
    const from = msg.from as Record<string, unknown> | undefined;
    await supabase.from("users").upsert({
      chat_id:    chatId,
      username:   from?.username   || null,
      first_name: from?.first_name || null,
      last_seen:  new Date().toISOString(),
    }, { onConflict: "chat_id" });

    await sendPrivateMessage(chatId);
    return new Response("ok");
  }

  // /history — соңғы 5 заявка
  if (text === "/history") {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("from_city, to_city, status, booking_type, created_at, rating")
      .eq("telegram_user_id", chatId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!bookings || bookings.length === 0) {
      await tgPost("sendMessage", {
        chat_id: chatId,
        text: "📋 Сизде ҳәли заявка жоқ.\n\nМини-апп арқылы такси яки жук машинасы заказ беринг 👇",
        reply_markup: {
          inline_keyboard: [[{ text: "🚕 Заявка беретуғын", web_app: { url: MINI_APP_URL } }]],
        },
      });
    } else {
      const lines = bookings.map((b, i) => {
        const date   = new Date(b.created_at).toLocaleDateString("ru-RU");
        const status = b.status === "taken" ? "✅ Алынды" : "⏳ Күтиледи";
        const type   = b.booking_type === "cargo" ? "📦" : "🚕";
        const stars  = b.rating ? " · " + "⭐".repeat(b.rating) : "";
        return `${i + 1}. ${type} ${b.from_city} → ${b.to_city}\n   ${status} · ${date}${stars}`;
      });

      await tgPost("sendMessage", {
        chat_id: chatId,
        text: `📋 Сиздиң заявкаларыңыз:\n\n${lines.join("\n\n")}`,
      });
    }
    return new Response("ok");
  }

  if (text === "/app") {
    await sendGroupMessage(chatId);
    return new Response("ok");
  }

  // ---- ТЕК ВЛАДЕЛЕЦ ----
  if (String(chatId) === String(OWNER_CHAT_ID)) {
    if (text === "/stats") {
      const { count: users }    = await supabase.from("users").select("*", { count: "exact", head: true });
      const { count: bookings } = await supabase.from("bookings").select("*", { count: "exact", head: true });
      const { data: ratings }   = await supabase.from("bookings").select("rating").not("rating", "is", null);
      const avg = ratings && ratings.length > 0
        ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
        : "—";

      await tgPost("sendMessage", {
        chat_id: chatId,
        text:
          `📊 *Статистика:*\n\n` +
          `👤 Пайдаланыушылар: *${users}*\n` +
          `📋 Жалпы заявкалар: *${bookings}*\n` +
          `⭐ Орташа баҳа: *${avg}*`,
        parse_mode: "Markdown",
      });
    }

    if (text.startsWith("/xabar ")) {
      const messageText = text.replace("/xabar ", "").trim();
      await tgPost("sendMessage", { chat_id: chatId, text: "⏳ Xabar yuborilmoqda..." });
      const result = await broadcastText(messageText);
      await tgPost("sendMessage", {
        chat_id: chatId,
        text: `✅ Yuborildi: ${result.sent} ta\n❌ Xato: ${result.failed} ta`,
      });
    }

    if (text.startsWith("/rasm ")) {
      const parts    = text.replace("/rasm ", "").trim().split(" ");
      const photoUrl = parts[0];
      const caption  = parts.slice(1).join(" ") || "";
      await tgPost("sendMessage", { chat_id: chatId, text: "⏳ Rasm yuborilmoqda..." });
      const result = await broadcastPhoto(photoUrl, caption);
      await tgPost("sendMessage", {
        chat_id: chatId,
        text: `✅ Yuborildi: ${result.sent} ta\n❌ Xato: ${result.failed} ta`,
      });
    }

    if (text === "/yordam") {
      await tgPost("sendMessage", {
        chat_id: chatId,
        parse_mode: "Markdown",
        text:
          `*Admin buyruqlari:*\n\n` +
          `📊 /stats — статистика\n` +
          `📋 /history — бот тарийхы (пайдаланыушы ушын да жумыс ислейди)\n\n` +
          `✉️ /xabar *Matn* — hammaga xabar\n` +
          `🖼 /rasm *LINK Yozuv* — hammaga rasm`,
      });
    }
  }

  return new Response("ok");
});

// ---- Telegram API ----
async function tgPost(method: string, payload: Record<string, unknown>) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ---- ЗАЯВКА ОБРАБОТЧИКИ ----
async function handleBooking(body: Record<string, unknown>) {
  const phone          = (body.phone as string)?.trim();
  const fromCity       = (body.fromCity as string)?.trim();
  const toCity         = (body.toCity as string)?.trim();
  const telegramUserId = (body.telegramUserId as number) || null;
  const telegramUsername = (body.telegramUsername as string) || null;
  const bookingType    = (body.bookingType as string) || "taxi";
  const passengers     = (body.passengers as number) || null;

  // Валидация
  if (!phone || !fromCity || !toCity) {
    return json({ error: "Maʼlumotlar toʼliq emas" }, 400);
  }
  if (!["taxi", "cargo"].includes(bookingType)) {
    return json({ error: "Notoʼgʼri tur" }, 400);
  }

  // ---- Жумыс ўақыты тексериу (07:00 — 22:00 UTC+5) ----
  const hourUTC5 = (new Date().getUTCHours() + 5) % 24;
  if (hourUTC5 < 7 || hourUTC5 >= 22) {
    return json({
      error: "working_hours",
      message: "Биз 7:00 — 22:00 аралығында жумыс ислеймиз",
    }, 400);
  }

  // Дедупликация
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("phone", phone)
    .eq("from_city", fromCity)
    .eq("to_city", toCity)
    .eq("status", "new")
    .gte("created_at", fiveMinutesAgo)
    .limit(1);

  if (existing && existing.length > 0) {
    return json({ error: "Buyurtma allaqachon yuborilgan, kuting" }, 429);
  }

  // Сохраняем
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert([{
      phone, from_city: fromCity, to_city: toCity,
      telegram_user_id: telegramUserId,
      telegram_username: telegramUsername,
      status: "new", booking_type: bookingType, passengers,
    }])
    .select("id")
    .single();

  if (error || !booking) {
    console.error("DB insert error:", error);
    return json({ error: "Saqlashda xatolik" }, 500);
  }

  const bookingId  = booking.id;
  const userInfo   = telegramUsername ? `@${telegramUsername}` : telegramUserId ? `ID: ${telegramUserId}` : "Номаълум";
  const typeLabel  = bookingType === "cargo"
    ? "📦 Pochta / Juk"
    : `🚕 Taksi (${passengers} yoʼlovchi)`;

  const ownerMsg =
    `🔔 Янги заявка!\n\n` +
    `📍 Маршрут: ${fromCity} → ${toCity}\n` +
    `🚗 Тур: ${typeLabel}\n` +
    `📞 Телефон: ${phone}\n` +
    `👤 Фойдаланувчи: ${userInfo}\n` +
    `🕐 Вақт: ${new Date().toLocaleString("ru-RU")}`;

  const notifications: Promise<unknown>[] = [
    tgPost("sendMessage", { chat_id: OWNER_CHAT_ID, text: ownerMsg }),
  ];

  if (DRIVER_GROUP_ID) {
    notifications.push(
      tgPost("sendMessage", {
        chat_id: DRIVER_GROUP_ID,
        text: `🔔 Yangi buyurtma!\n\n📍 Marshrut: ${fromCity} → ${toCity}\n🚗 Tur: ${typeLabel}\n⏳ Status: kutilmoqda...`,
        reply_markup: {
          inline_keyboard: [[{ text: "✅ Olish", callback_data: `take|${bookingId}` }]],
        },
      })
    );
  }

  await Promise.allSettled(notifications);
  return json({ ok: true });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---- РАССЫЛКА ----
async function broadcastText(message: string) {
  const { data: users } = await supabase.from("users").select("chat_id");
  let sent = 0, failed = 0;
  for (const user of users || []) {
    try {
      const res  = await tgPost("sendMessage", { chat_id: user.chat_id, text: message });
      const data = await res.json();
      if (data.ok) sent++; else failed++;
    } catch { failed++; }
    await new Promise(r => setTimeout(r, 50));
  }
  return { sent, failed };
}

async function broadcastPhoto(photoUrl: string, caption: string) {
  const { data: users } = await supabase.from("users").select("chat_id");
  let sent = 0, failed = 0;
  for (const user of users || []) {
    try {
      const res  = await tgPost("sendPhoto", { chat_id: user.chat_id, photo: photoUrl, caption });
      const data = await res.json();
      if (data.ok) sent++; else failed++;
    } catch { failed++; }
    await new Promise(r => setTimeout(r, 50));
  }
  return { sent, failed };
}

// ---- ХАБАРЛАР ----
async function sendPrivateMessage(chatId: number) {
  await tgPost("sendMessage", {
    chat_id: chatId,
    text:
      `Ассалаума Алейкум\nБотимизға хош келипсыз 😊\n` +
      `Сиз ботимизда Қалаларға, Районларға таксилерды хам Нөкис қаласиндағы жук машинларын таба аласыз\n` +
      `STARTти басың ⏬`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚕 START", web_app: { url: MINI_APP_URL } }],
        [{ text: "📋 Заявкаларым", callback_data: "history" }],
      ],
    },
  });
}

async function sendGroupMessage(chatId: number) {
  await tgPost("sendMessage", {
    chat_id: chatId,
    text:
      `Taksi 🚕 Xizmetleri Usi Jerde!\n` +
      `Assalawma Aleykum\n` +
      `Qaraqalpaqstandagi rayonlarga añsat ham tez taksi xizmeti\n` +
      `Gruppalarga kirip juriw shart emes. Hammesi bir Botta ✅`,
    reply_markup: {
      inline_keyboard: [[{ text: "🚕 TAKSI", url: MINI_APP_URL }]],
    },
  });
}
