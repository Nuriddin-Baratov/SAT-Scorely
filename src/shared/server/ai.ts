import "server-only";

import { queryOne } from "./db";
import { tashkentDay } from "./xp";

/** AI ustozga bir kunda beriladigan savollar soni (har bir foydalanuvchi uchun) */
export const AI_DAILY_LIMIT = 10;

export const aiConfigured = () => !!process.env.ANTHROPIC_API_KEY;

/** Bugungi AI savollari */
export async function aiStatus(userId: string) {
  const row = await queryOne<{ count: number }>("select count from ai_usage where user_id = $1 and day = $2", [userId, tashkentDay()]);
  return { used: row?.count ?? 0, limit: AI_DAILY_LIMIT };
}

/** Kunlik limit doirasida bitta savolni hisobga oladi (atomik). Limit tugagan bo'lsa `false`. */
export async function takeAiQuota(userId: string, limit: number) {
  const row = await queryOne<{ count: number }>(
    `insert into ai_usage (user_id, day, count) values ($1, $2, 1)
     on conflict (user_id, day) do update set count = ai_usage.count + 1
     where ai_usage.count < $3
     returning count`,
    [userId, tashkentDay(), limit],
  );
  return !!row;
}

/** Javob olinmagan bo'lsa (xato), savol qaytariladi */
export async function refundAiQuota(userId: string) {
  await queryOne(`update ai_usage set count = greatest(0, count - 1) where user_id = $1 and day = $2`, [userId, tashkentDay()]);
}
