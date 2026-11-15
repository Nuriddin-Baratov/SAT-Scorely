import "server-only";

import { dailyQuestionFor, getQuestion, isCorrect, type Question } from "@/entities/practice-test";
import { getDictionary, hasLocale, localizePath, type Locale } from "@/shared/i18n";
import {
  claimLinkCode,
  dailyRecipients,
  escapeHtml,
  linkByChat,
  recordAnswer,
  setDailyEnabled,
  tg,
} from "@/shared/server";

const LETTERS = ["A", "B", "C", "D"];

/** O'zbekiston vaqti bo'yicha bugungi sana */
export function todayTashkent(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(date);
}

function appUrl(path = "/") {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

function pickLocale(value: string | undefined | null): Locale {
  const short = value?.slice(0, 2).toLowerCase();
  return hasLocale(short) ? short : "uz";
}

function questionText(q: Question, locale: Locale, intro: string) {
  const t = getDictionary(locale);
  const parts = [`<b>${escapeHtml(intro)}</b>`, `<i>${escapeHtml(t.domains[q.domainId])} · ${escapeHtml(t.levels[q.difficulty])}</i>`, ""];
  if (q.passage) parts.push(`<blockquote>${escapeHtml(q.passage)}</blockquote>`);
  parts.push(escapeHtml(q.prompt));
  if (q.format !== "spr") {
    parts.push("");
    q.choices.forEach((c, i) => parts.push(`<b>${LETTERS[i]})</b> ${escapeHtml(c)}`));
  }
  return parts.join("\n");
}

/** Kunlik savolni chatga yuboradi (A–D tugmalari bilan) */
export async function sendDailyQuestion(chatId: number | string, locale: Locale, extra?: string) {
  const day = todayTashkent();
  const q = dailyQuestionFor(day);
  const t = getDictionary(locale).bot;
  const text = [extra ? `${escapeHtml(extra)}\n` : "", questionText(q, locale, t.dailyTitle)].join("");
  await tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        LETTERS.map((letter, i) => ({ text: letter, callback_data: `a:${day}:${q.id}:${i}` })),
        [{ text: t.openSite, url: appUrl(localizePath(locale, "/")) }],
      ],
    },
  });
}

/** Ertalabki tarqatma (cron): hamma obunachilarga kunlik savol + seriya eslatmasi */
export async function broadcastDaily() {
  const recipients = await dailyRecipients();
  const yesterday = todayTashkent(new Date(Date.now() - 86_400_000));
  let sent = 0;
  for (const r of recipients) {
    const locale = pickLocale(r.locale);
    const t = getDictionary(locale).bot;
    const streak = Number(r.streak ?? 0);
    // Kecha faol bo'lgan va seriyasi bor foydalanuvchiga — uzilmasin degan eslatma
    const reminder = streak > 0 && r.last_active === yesterday ? t.streakReminder(streak) : undefined;
    await sendDailyQuestion(r.chat_id, locale, reminder);
    sent++;
    await new Promise((resolve) => setTimeout(resolve, 40)); // Telegram limitlari (≈30 xabar/soniya)
  }
  return sent;
}

// ---------------- Webhook ----------------

interface TgUpdate {
  message?: { chat: { id: number }; text?: string; from?: { language_code?: string } };
  callback_query?: {
    id: string;
    data?: string;
    from?: { language_code?: string };
    message?: { chat: { id: number }; message_id: number; text?: string };
  };
}

async function reply(chatId: number, text: string, keyboard?: unknown) {
  await tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...(keyboard ? { reply_markup: keyboard } : {}) });
}

export async function handleUpdate(update: TgUpdate) {
  if (update.callback_query) return handleAnswer(update.callback_query);
  const message = update.message;
  if (!message?.text) return;

  const chatId = message.chat.id;
  const [command, arg] = message.text.trim().split(/\s+/, 2);
  const link = await linkByChat(chatId);
  const locale = pickLocale(link?.locale ?? message.from?.language_code);
  const t = getDictionary(locale).bot;

  switch (command.split("@")[0]) {
    case "/start": {
      if (arg) {
        const claimed = await claimLinkCode(arg, chatId);
        if (!claimed) return reply(chatId, t.badCode);
        const claimedLocale = pickLocale(claimed.locale);
        const tc = getDictionary(claimedLocale).bot;
        await reply(chatId, tc.linked(escapeHtml(claimed.name.split(/\s+/)[0])));
        return sendDailyQuestion(chatId, claimedLocale);
      }
      return reply(chatId, link ? t.help : t.welcome, {
        inline_keyboard: [[{ text: t.openSettings, url: appUrl(localizePath(locale, "/settings")) }]],
      });
    }
    case "/daily":
    case "/savol":
    case "/question":
      return sendDailyQuestion(chatId, locale);
    case "/stats":
      if (!link) return reply(chatId, t.notLinked);
      return reply(chatId, t.stats(Number(link.xp ?? 0), Number(link.streak ?? 0)));
    case "/stop":
      if (!link) return reply(chatId, t.notLinked);
      await setDailyEnabled(chatId, false);
      return reply(chatId, t.stopped);
    case "/resume":
      if (!link) return reply(chatId, t.notLinked);
      await setDailyEnabled(chatId, true);
      return reply(chatId, t.resumed);
    default:
      return reply(chatId, t.help);
  }
}

async function handleAnswer(cb: NonNullable<TgUpdate["callback_query"]>) {
  const [kind, day, questionId, choice] = (cb.data ?? "").split(":");
  const chatId = cb.message?.chat.id;
  const q = getQuestion(questionId);
  if (kind !== "a" || !chatId || !q || q.format === "spr") {
    await tg("answerCallbackQuery", { callback_query_id: cb.id });
    return;
  }

  const link = await linkByChat(chatId);
  const locale = pickLocale(link?.locale ?? cb.from?.language_code);
  const t = getDictionary(locale);
  const index = Number(choice);
  const correct = isCorrect(q, index);
  const first = await recordAnswer(chatId, day, q.id, correct);

  await tg("answerCallbackQuery", {
    callback_query_id: cb.id,
    text: !first ? t.bot.alreadyAnswered : correct ? t.bot.correct : t.bot.wrong,
  });
  if (!first || !cb.message) return;

  const result = [
    questionText(q, locale, t.bot.dailyTitle),
    "",
    `${correct ? "✅" : "❌"} <b>${escapeHtml(correct ? t.bot.correct : t.bot.wrong)}</b> · ${escapeHtml(t.runner.correctAnswer)}: <b>${LETTERS[q.answer]}</b>`,
    `<i>${escapeHtml(q.explanation[locale])}</i>`,
  ].join("\n");

  await tg("editMessageText", {
    chat_id: chatId,
    message_id: cb.message.message_id,
    text: result,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [[{ text: t.bot.openSite, url: appUrl(localizePath(locale, "/practice")) }]] },
  });
}
