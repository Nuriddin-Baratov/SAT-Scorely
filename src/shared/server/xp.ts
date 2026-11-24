import "server-only";

import { query, queryOne } from "./db";

/**
 * XP daftari (ledger). XP faqat shu yerda yoziladi: har bir hodisa bir marta (`event_id` va `dedupe` takrorlanmas),
 * jami XP va seriya shu yozuv bilan bitta atomik so'rovda yangilanadi.
 */

/** Bir kunda olinadigan eng ko'p XP */
export const DAILY_XP_CAP = 1500;

export interface XpEvent {
  eventId: string;
  kind: "test" | "daily" | "practice" | "review" | "word";
  /** Nima uchun: test, savol, so'z yoki sana */
  ref: string;
  /** Takrorlanmas kalit (masalan, `word:abundant`); `null` — faqat `eventId` bo'yicha */
  dedupe: string | null;
  xp: number;
  correct?: number;
  total?: number;
  mastered?: boolean;
  /** Testda domenlar kesimi: `{ algebra: [to'g'ri, jami] }` */
  detail?: Record<string, [number, number]>;
  day: string;
}

/** O'zbekiston vaqti bo'yicha kun */
export function tashkentDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(date);
}

/** Hodisani yozadi. Qaytaradi: haqiqatda berilgan XP (takror bo'lsa 0) va jami XP. */
export async function recordXp(userId: string, event: XpEvent): Promise<{ awarded: number; total: number }> {
  const row = await queryOne<{ awarded: number | null; total: number }>(
    `with cap as (
       select greatest(0, $12::int - coalesce(sum(xp), 0))::int as left_xp
       from xp_events where user_id = $1::text and awarded_on = $11::text
     ), ins as (
       insert into xp_events (user_id, event_id, kind, ref, dedupe, xp, correct, total, mastered, detail, day, awarded_on)
       select $1::text, $2::text, $3::text, $4::text, $5::text, least($6::int, (select left_xp from cap)), $7::int, $8::int, $13::boolean, $9::text::jsonb, $10::text, $11::text
       on conflict do nothing
       returning xp, day
     ), ud as (
       insert into user_data (user_id, snapshot, xp, streak, last_active)
       select $1::text, '{}'::jsonb, ins.xp, 1, ins.day from ins
       on conflict (user_id) do update set
         xp = user_data.xp + excluded.xp,
         streak = case
           when user_data.last_active = excluded.last_active then greatest(user_data.streak, 1)
           when user_data.last_active > excluded.last_active then user_data.streak
           when user_data.last_active = (excluded.last_active::date - 1)::text then user_data.streak + 1
           else 1
         end,
         last_active = greatest(user_data.last_active, excluded.last_active),
         updated_at = now()
       returning xp
     ), dd as (
       insert into xp_daily (user_id, day, xp) select $1::text, $11::text, ud.xp from ud
       on conflict (user_id, day) do update set xp = greatest(xp_daily.xp, excluded.xp)
     )
     select (select xp from ins) as awarded,
       coalesce((select xp from ud), (select xp from user_data where user_id = $1::text), 0) as total`,
    [
      userId,
      event.eventId,
      event.kind,
      event.ref,
      event.dedupe,
      Math.max(0, Math.round(event.xp)),
      event.correct ?? null,
      event.total ?? null,
      event.detail ? JSON.stringify(event.detail) : null,
      event.day,
      tashkentDay(),
      DAILY_XP_CAP,
      event.mastered ?? false,
    ],
  );
  return { awarded: Number(row?.awarded ?? 0), total: Number(row?.total ?? 0) };
}

/** Savol avval o'zlashtirilib, bonus olinganmi */
export async function alreadyMastered(userId: string, questionId: string) {
  return !!(await queryOne("select 1 as ok from xp_events where user_id = $1 and kind = 'review' and ref = $2 and mastered limit 1", [userId, questionId]));
}

/** Aniqlik va zaif mavzu — server tekshirgan testlardan (o'qituvchi paneli uchun) */
export async function refreshTestStats(userId: string) {
  const rows = await query<{ correct: number; total: number; detail: Record<string, [number, number]> | null }>(
    "select correct, total, detail from xp_events where user_id = $1 and kind = 'test' order by created_at desc limit 200",
    [userId],
  );
  let correct = 0;
  let total = 0;
  const domains: Record<string, [number, number]> = {};
  for (const row of rows) {
    correct += Number(row.correct ?? 0);
    total += Number(row.total ?? 0);
    for (const [id, [c, n]] of Object.entries(row.detail ?? {})) {
      const d = (domains[id] ??= [0, 0]);
      d[0] += c;
      d[1] += n;
    }
  }
  const weakest = Object.entries(domains)
    .filter(([, [c, n]]) => n >= 3 && c / n < 0.8)
    .sort(([, a], [, b]) => a[0] / a[1] - b[0] / b[1])[0];
  await query("update user_data set accuracy = $2::real, questions = $3::int, weak_domain = $4::text where user_id = $1", [
    userId,
    total ? correct / total : null,
    total,
    weakest?.[0] ?? null,
  ]);
}
