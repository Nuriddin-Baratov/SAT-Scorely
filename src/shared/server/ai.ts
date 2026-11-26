import "server-only";

import { queryOne } from "./db";
import { tashkentDay } from "./xp";

/** AI ustozga kunlik savollar soni (tarif bo'yicha) */
export const AI_LIMITS = { free: 10, pro: 150 } as const;
export type Plan = keyof typeof AI_LIMITS;

export const aiConfigured = () => !!process.env.ANTHROPIC_API_KEY;

/** Foydalanuvchi tarifi va bugungi AI savollari */
export async function aiStatus(userId: string) {
  const row = await queryOne<{ plan: string; plan_until: string | null; used: number | null }>(
    `select u.plan, u.plan_until, a.count as used
     from users u left join ai_usage a on a.user_id = u.id and a.day = $2
     where u.id = $1`,
    [userId, tashkentDay()],
  );
  // Pro muddati o'tgan bo'lsa — bepul
  const active = row?.plan === "pro" && (!row.plan_until || new Date(row.plan_until) > new Date());
  const plan: Plan = active ? "pro" : "free";
  return { plan, planUntil: active ? row?.plan_until ?? null : null, used: row?.used ?? 0, limit: AI_LIMITS[plan] };
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
