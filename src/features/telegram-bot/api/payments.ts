import "server-only";

import { getDictionary, hasLocale, localizePath } from "@/shared/i18n";
import { decidePayment, escapeHtml, payConfig, paymentUser, tg, tgUpload } from "@/shared/server";

const money = (n: number) => `${n.toLocaleString("ru-RU").replace(/ /g, " ")} so'm`;
const appUrl = (path: string) => `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;

/** Adminga chek rasmi + "Tasdiqlash / Rad etish" tugmalari. Yuborilmasa — `false`. */
export async function notifyAdmin(payment: { id: string; userId: string; amount: number }, receipt: Buffer) {
  const { admin } = payConfig();
  const user = await paymentUser(payment.userId);
  if (!admin || !user) return false;
  const caption = [
    "💳 <b>Yangi to'lov — Pro (1 oy)</b>",
    `👤 ${escapeHtml(user.name)}`,
    `✉️ ${escapeHtml(user.email)}`,
    `💰 ${money(payment.amount)}`,
    "",
    "Bank ilovangizda pul tushganini tekshirib, keyin tasdiqlang.",
  ].join("\n");
  const sent = await tgUpload(
    "sendPhoto",
    {
      chat_id: admin,
      caption,
      parse_mode: "HTML",
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            { text: "✅ Tasdiqlash", callback_data: `pay:ok:${payment.id}` },
            { text: "❌ Rad etish", callback_data: `pay:no:${payment.id}` },
          ],
        ],
      }),
    },
    { field: "photo", name: "receipt.jpg", type: "image/jpeg", data: receipt },
  );
  return !!sent;
}

interface Callback {
  id: string;
  data?: string;
  from?: { id: number };
  message?: { chat: { id: number }; message_id: number; caption?: string };
}

/** Admin tugmani bosdi. Faqat `ADMIN_TELEGRAM_CHAT_ID` dan kelgan bosish qabul qilinadi. */
export async function handlePaymentDecision(cb: Callback) {
  const [, action, id] = (cb.data ?? "").split(":");
  const { admin } = payConfig();
  const chatId = cb.message?.chat.id;
  if (!admin || String(chatId) !== admin || String(cb.from?.id) !== admin) {
    await tg("answerCallbackQuery", { callback_query_id: cb.id, text: "Ruxsat yo'q" });
    return;
  }
  const approve = action === "ok";
  const result = await decidePayment(id, approve);
  if (!result) {
    await tg("answerCallbackQuery", { callback_query_id: cb.id, text: "Bu to'lov allaqachon ko'rib chiqilgan" });
    return;
  }
  await tg("answerCallbackQuery", { callback_query_id: cb.id, text: approve ? "Pro yoqildi ✅" : "Rad etildi" });

  const until = result.planUntil ? new Date(result.planUntil).toISOString().slice(0, 10) : null;
  if (cb.message) {
    await tg("editMessageCaption", {
      chat_id: chatId,
      message_id: cb.message.message_id,
      caption: `${escapeHtml(cb.message.caption ?? "")}\n\n${approve ? `✅ <b>Tasdiqlandi</b> — Pro ${until} gacha` : "❌ <b>Rad etildi</b>"}`,
      parse_mode: "HTML",
    });
  }

  // O'quvchining Telegram'i ulangan bo'lsa — xabar
  const user = await paymentUser(result.user_id);
  if (user?.chat_id) {
    const locale = hasLocale(user.locale ?? "") ? (user.locale as "uz" | "ru" | "en") : "uz";
    const t = getDictionary(locale).bot;
    await tg("sendMessage", {
      chat_id: user.chat_id,
      text: approve && until ? t.payApproved(until) : t.payRejected,
      reply_markup: { inline_keyboard: [[{ text: t.openSite, url: appUrl(localizePath(locale, "/plans")) }]] },
    });
  }
}
