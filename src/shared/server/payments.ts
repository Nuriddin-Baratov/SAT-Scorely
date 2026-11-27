import "server-only";

import { newId } from "./crypto";
import { query, queryOne } from "./db";

/**
 * Pro to'lovi: o'quvchi karta raqamiga o'tkazadi va chekni yuboradi, admin Telegram'da tasdiqlaydi.
 * Pul to'g'ridan-to'g'ri `PAY_CARD_NUMBER` kartaga tushadi — sayt pulni ushlab turmaydi.
 */

/** Pro narxi (so'm, 1 oy). Lug'atdagi "49 000 so'm" matni bilan bir xil bo'lsin. */
export const PRO_PRICE = 49_000;

export function payConfig() {
  const card = (process.env.PAY_CARD_NUMBER ?? "").replace(/\D/g, "");
  const holder = (process.env.PAY_CARD_HOLDER ?? "").trim();
  const admin = (process.env.ADMIN_TELEGRAM_CHAT_ID ?? "").trim();
  const ready = card.length >= 16 && !!admin && !!process.env.TELEGRAM_BOT_TOKEN;
  return { ready, card, holder, admin };
}

export type PaymentStatus = "pending" | "approved" | "rejected";

export interface PaymentRow {
  id: string;
  user_id: string;
  amount: number;
  months: number;
  status: PaymentStatus;
  created_at: string;
  decided_at: string | null;
}

export function latestPayment(userId: string) {
  return queryOne<PaymentRow>("select * from payments where user_id = $1 order by created_at desc limit 1", [userId]);
}

/** Yangi kutilayotgan to'lov. Kutilayotgani bo'lsa — `null` (bir vaqtda bittadan). */
export async function createPayment(userId: string, months = 1) {
  const pending = await queryOne("select 1 as ok from payments where user_id = $1 and status = 'pending'", [userId]);
  if (pending) return null;
  const id = newId();
  await query("insert into payments (id, user_id, amount, months) values ($1, $2, $3, $4)", [id, userId, PRO_PRICE * months, months]);
  return id;
}

export async function deletePayment(id: string) {
  await query("delete from payments where id = $1 and status = 'pending'", [id]);
}

/**
 * Admin qarori. Tasdiqlansa Pro yoqiladi: amaldagi muddat tugamagan bo'lsa — undan keyin uzaytiriladi.
 * Allaqachon hal qilingan to'lov qayta o'zgarmaydi (`null`).
 */
export async function decidePayment(id: string, approve: boolean) {
  const row = await queryOne<{ user_id: string; months: number; amount: number }>(
    `update payments set status = $2, decided_at = now() where id = $1 and status = 'pending' returning user_id, months, amount`,
    [id, approve ? "approved" : "rejected"],
  );
  if (!row) return null;
  if (!approve) return { ...row, planUntil: null };
  const user = await queryOne<{ plan_until: string }>(
    `update users set plan = 'pro',
       plan_until = greatest(coalesce(plan_until, now()), now()) + make_interval(months => $2::int)
     where id = $1 returning plan_until`,
    [row.user_id, row.months],
  );
  return { ...row, planUntil: user?.plan_until ?? null };
}

/** Admin xabari uchun: kim to'ladi */
export function paymentUser(userId: string) {
  return queryOne<{ name: string; email: string; chat_id: string | null; locale: string | null }>(
    `select u.name, u.email, l.chat_id::text as chat_id, l.locale
     from users u left join telegram_links l on l.user_id = u.id
     where u.id = $1`,
    [userId],
  );
}
