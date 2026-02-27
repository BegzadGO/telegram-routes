import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN") ?? "";
const MINI_APP_URL = Deno.env.get("MINI_APP_URL") ?? "https://telegram-routes.vercel.app/";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Проверяем секретный токен — без него никто не может вызвать функцию
  const secretToken = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (!WEBHOOK_SECRET || secretToken !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let update;
  try {
    update = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // ── ВОДИТЕЛЬ НАЖАЛ "✅ OLISH" ──────────────────────────────────
  if (update.callback_query) {
    const query = update.callback_query;

    if (query.data?.startsWith("take|")) {
      const [, phone, fromCity, toCity] = query.data.split("|");

      const driver = query.from.username
        ? `@${query.from.username}`
        : query.from.first_name || "Haydovchi";

      try {
        // Защита от двойного принятия:
        // UPDATE только если status = 'new' — если уже взята, ничего не изменится
        const { data: updated, error: updateError } = await supabase
          .from("bookings")
          .update({
            status: "taken",
            taken_by: driver,
            taken_by_telegram_id: String(query.from.id),
          })
          .eq("phone", phone)
          .eq("status", "new")
          .select("id")
          .single();

        if (updateError || !updated) {
          // Заявка уже взята другим водителем
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              callback_query_id: query.id,
              text: "❌ Buyurtma allaqachon boshqa haydovchi tomonidan olingan!",
              show_alert: true,
            }),
          });
          return new Response("ok");
        }

        // Успешно взял — редактируем сообщение в группе
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            text:
              `✅ Buyurtma olindi!\n\n` +
              `📍 Marshrut: ${fromCity} → ${toCity}\n` +
              `🚕 Haydovchi: ${driver}`,
          }),
        });

        // Показываем водителю номер телефона
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: query.id,
            text: `✅ Buyurtma sizga biriktirildi!\n📞 ${phone}`,
            show_alert: true,
          }),
        });

      } catch (err) {
        console.error("Error handling take action:", err);
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: query.id,
            text: "⚠️ Xatolik yuz berdi, qaytadan urining.",
            show_alert: true,
          }),
        });
      }
    }

    return new Response("ok");
  }

  // ── БОТА ДОБАВИЛИ В ГРУППУ ─────────────────────────────────────
  if (update.my_chat_member) {
    const chat = update.my_chat_member.chat;
    const newStatus = update.my_chat_member.new_chat_member?.status;

    if (newStatus === "member" || newStatus === "administrator") {
      await sendGroupMessage(chat.id);
    }

    return new Response("ok");
  }

  // ── ВХОДЯЩЕЕ СООБЩЕНИЕ ─────────────────────────────────────────
  if (!update.message) {
    return new Response("ok");
  }

  const chatId = update.message.chat.id;
  const text = update.message.text ?? "";

  if (text === "/start") {
    await sendPrivateMessage(chatId);
  }

  if (text === "/app") {
    await sendGroupMessage(chatId);
  }

  return new Response("ok");
});

// ── ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ────────────────────────────────────

async function sendPrivateMessage(chatId: number) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text:
        `Assalawma Aleykum\n` +
        `Botimizğa xosh kelipsiz 😊\n` +
        `Siz botimizda Rayonlarğa taksilerdi ham Nokis qalasindaği juk mashinlarin taba alasiz\n` +
        `STARTti basiñ ⏬`,
      reply_markup: {
        inline_keyboard: [[
          { text: "🚕 START", web_app: { url: MINI_APP_URL } },
        ]],
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
      text:
        `Taksi 🚕 Xizmetleri Usi Jerde!\n` +
        `Assalawma Aleykum\n` +
        `Qaraqalpaqstandagi rayonlarga añsat ham tez taksi xizmeti\n` +
        `Gruppalarga kirip juriw shart emes — Hammesi bir Botta ✅`,
      reply_markup: {
        inline_keyboard: [[
          { text: "🚕 TAKSI", url: MINI_APP_URL },
        ]],
      },
    }),
  });
      }

