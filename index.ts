import { serve } from "https://deno.land/std/http/server.ts";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
const MINI_APP_URL = "https://telegram-routes.vercel.app/";

serve(async (req) => {
  const update = await req.json();

    // ---- 1. ЕСЛИ БОТА ДОБАВИЛИ В ГРУППУ ----
      if (update.my_chat_member) {
          const chat = update.my_chat_member.chat;
              const newStatus = update.my_chat_member.new_chat_member.status;

                  if (newStatus === "member" || newStatus === "administrator") {
                        await sendGroupMessage(chat.id);
                            }

                                return new Response("ok");
                                  }

                                    // ---- 2. ЕСЛИ НАПИСАЛИ СООБЩЕНИЕ ----
                                      if (!update.message) {
                                          return new Response("ok");
                                            }

                                              const chatId = update.message.chat.id;
                                                const text = update.message.text;

                                                  // ---- /start В ЛИЧКЕ ----
                                                    if (text === "/start") {
                                                        await sendPrivateMessage(chatId);
                                                          }

                                                            // ---- /app В ГРУППЕ ИЛИ ЛИЧКЕ ----
                                                              if (text === "/app") {
                                                                  await sendGroupMessage(chatId);
                                                                    }

                                                                      return new Response("ok");
                                                                      });

                                                                      // ======================
                                                                      // 📩 ФУНКЦИИ ОТПРАВКИ
                                                                      // ======================

                                                                      async function sendPrivateMessage(chatId: number) {
                                                                        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                                                            method: "POST",
                                                                                headers: { "Content-Type": "application/json" },
                                                                                    body: JSON.stringify({
                                                                                          chat_id: chatId,
                                                                                                text:
                                                                                                `Assalawma Aleykum
Botimizğa xosh kelipsiz😊
Siz botimizda Rayonlarğa taksilerdi ham Nokis qalasindaği juk mashinlarin taba alasiz
STARTti basiñ⏬`,
                                                                                                      reply_markup: {
                                                                                                              inline_keyboard: [[
                                                                                                                        {
                                                                                                                                    text: "🚕 START",
                                                                                                                                                web_app: { url: MINI_APP_URL }
                                                                                                                                                          }
                                                                                                                                                                  ]]
                                                                                                                                                                        }
                                                                                                                                                                            })
                                                                                                                                                                              });
                                                                                                                                                                              }

                                                                                                                                                                              async function sendGroupMessage(chatId: number) {
                                                                                                                                                                                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                                                                                                                                                                    method: "POST",
                                                                                                                                                                                        headers: { "Content-Type": "application/json" },
                                                                                                                                                                                            body: JSON.stringify({
                                                                                                                                                                                                  chat_id: chatId,
                                                                                                                                                                                                        text:
                                                                                                                                                                                                        `Taksi 🚕 Xizmetleri Usi Jerde!
Assalawma Aleykum
Qaraqalpaqstandagi rayonlarga añsat ham tez taksi xizmeti
Gruppalarga kirip juriw shart emes Hammesi bir Botta ✅`,
                                                                                                                                                                                                              reply_markup: {
                                                                                                                                                                                                                      inline_keyboard: [[
                                                                                                                                                                                                                                {
                                                                                                                                                                                                                                            text: "🚕 TAKSI",
                                                                                                                                                                                                                                                        web_app: { url: MINI_APP_URL }
                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                          ]]
                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                    })
                                                                                                                                                                                                                                                                                      });
                                                                                                                                                                                                                                                                                      }