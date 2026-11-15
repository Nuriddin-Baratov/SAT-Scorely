import "server-only";

import { shortCode } from "./crypto";
import { query, queryOne } from "./db";

// ---------------- Telegram Bot API ----------------

const API = "https://api.telegram.org";

export function telegramConfigured() {
  return !!process.env.TELEGRAM_BOT_TOKEN;
}

export async function tg<T = unknown>(method: string, body: Record<string, unknown>): Promise<T | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as { ok: boolean; result: T; description?: string } | null;
  if (!data?.ok) {
    console.warn(`[telegram] ${method} failed:`, data?.description ?? res.status);
    return null;
  }
  return data.result;
}

/** Telegram HTML rejimi uchun maxsus belgilarni qochirish */
export function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------------- Akkauntni bog'lash ----------------

export interface TelegramLink {
  user_id: string;
  chat_id: string | null;
  locale: string;
  daily_enabled: boolean;
}

/** Saytdagi akkaunt uchun bir martalik ulash kodi (15 daqiqa amal qiladi) */
export async function createLinkCode(userId: string, locale: string) {
  const code = shortCode(8);
  await query(
    `insert into telegram_links (user_id, link_code, code_expires_at, locale)
     values ($1, $2, now() + interval '15 minutes', $3)
     on conflict (user_id) do update set link_code = excluded.link_code, code_expires_at = excluded.code_expires_at, locale = excluded.locale`,
    [userId, code, locale],
  );
  return code;
}

export async function linkStatus(userId: string) {
  return queryOne<TelegramLink>("select user_id, chat_id::text as chat_id, locale, daily_enabled from telegram_links where user_id = $1", [userId]);
}

export async function unlink(userId: string) {
  await query("delete from telegram_links where user_id = $1", [userId]);
}

/** Bot `/start <kod>` olganda: kod to'g'ri bo'lsa chatni akkauntga bog'laydi */
export async function claimLinkCode(code: string, chatId: number) {
  // Bu chat boshqa akkauntga bog'langan bo'lsa — uni bo'shatamiz
  await query("update telegram_links set chat_id = null where chat_id = $1", [chatId]);
  return queryOne<{ user_id: string; locale: string; name: string }>(
    `update telegram_links l set chat_id = $2, link_code = null, code_expires_at = null
     from users u
     where l.link_code = $1 and l.code_expires_at > now() and u.id = l.user_id
     returning l.user_id, l.locale, u.name`,
    [code.trim().toUpperCase(), chatId],
  );
}

export async function linkByChat(chatId: number) {
  return queryOne<TelegramLink & { name: string; xp: number | null; streak: number | null; last_active: string | null }>(
    `select l.user_id, l.chat_id::text as chat_id, l.locale, l.daily_enabled, u.name, d.xp, d.streak, d.last_active
     from telegram_links l join users u on u.id = l.user_id left join user_data d on d.user_id = l.user_id
     where l.chat_id = $1`,
    [chatId],
  );
}

export async function setDailyEnabled(chatId: number, enabled: boolean) {
  await query("update telegram_links set daily_enabled = $2 where chat_id = $1", [chatId, enabled]);
}

export async function dailyRecipients() {
  return query<{ chat_id: string; locale: string; streak: number | null; last_active: string | null }>(
    `select l.chat_id::text as chat_id, l.locale, d.streak, d.last_active
     from telegram_links l left join user_data d on d.user_id = l.user_id
     where l.chat_id is not null and l.daily_enabled = true`,
  );
}

/** Kunlik savolga javobni bir marta yozadi; avval javob berilgan bo'lsa `false` */
export async function recordAnswer(chatId: number, day: string, questionId: string, correct: boolean) {
  const rows = await query(
    `insert into telegram_answers (chat_id, day, question_id, correct) values ($1, $2, $3, $4)
     on conflict (chat_id, day) do nothing returning 1`,
    [chatId, day, questionId, correct],
  );
  return rows.length > 0;
}
