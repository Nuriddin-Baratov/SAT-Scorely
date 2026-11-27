import "server-only";

import { newId } from "./crypto";
import { query, queryOne } from "./db";
import { escapeHtml, tg } from "./telegram";

/**
 * Pro to'lovi Payme yoki Click orqali. O'quvchi kartasini to'lov tizimi sahifasida kiritadi,
 * pul merchant kabinet orqali egasining kartasiga tushadi, tizim saytga xabar beradi va Pro avtomatik yoqiladi.
 */

/** Pro narxi (so'm, 1 oy). Lug'atdagi "49 000 so'm" bilan bir xil bo'lsin. */
export const PRO_PRICE = 49_000;

export type Provider = "payme" | "click";

export function billing() {
  const e = process.env;
  const payme = e.PAYME_MERCHANT_ID && e.PAYME_KEY ? { merchantId: e.PAYME_MERCHANT_ID, key: e.PAYME_KEY, test: e.PAYME_TEST === "1" } : null;
  const click =
    e.CLICK_SERVICE_ID && e.CLICK_MERCHANT_ID && e.CLICK_SECRET_KEY
      ? { serviceId: e.CLICK_SERVICE_ID, merchantId: e.CLICK_MERCHANT_ID, secret: e.CLICK_SECRET_KEY }
      : null;
  return { payme, click, providers: [...(payme ? ["payme" as const] : []), ...(click ? ["click" as const] : [])] };
}

export interface OrderRow {
  id: string;
  seq: string;
  user_id: string;
  provider: Provider;
  amount: number;
  months: number;
  status: "new" | "paid" | "cancelled";
  ext_id: string | null;
  pay_state: number | null;
  create_time: string | null;
  perform_time: string | null;
  cancel_time: string | null;
  cancel_reason: number | null;
}

export async function createOrder(userId: string, provider: Provider, months = 1) {
  const id = newId();
  await query("insert into orders (id, user_id, provider, amount, months) values ($1, $2, $3, $4, $5)", [id, userId, provider, PRO_PRICE * months, months]);
  return id;
}

export const getOrder = (id: string) => queryOne<OrderRow>("select * from orders where id = $1", [id]);
export const orderByExt = (provider: Provider, extId: string) => queryOne<OrderRow>("select * from orders where provider = $1 and ext_id = $2", [provider, extId]);

/** Foydalanuvchining o'z buyurtmasi (holatni kuzatish uchun) */
export const userOrder = (id: string, userId: string) =>
  queryOne<{ status: OrderRow["status"]; provider: Provider }>("select status, provider from orders where id = $1 and user_id = $2", [id, userId]);

/** To'lov o'tdi: Pro yoqiladi (faol bo'lsa — muddati uzaytiriladi) va adminga xabar */
export async function activatePro(order: Pick<OrderRow, "user_id" | "months" | "amount" | "provider">) {
  const user = await queryOne<{ name: string; email: string; plan_until: string }>(
    `update users set plan = 'pro',
       plan_until = greatest(coalesce(plan_until, now()), now()) + make_interval(months => $2::int)
     where id = $1 returning name, email, plan_until`,
    [order.user_id, order.months],
  );
  const admin = process.env.ADMIN_TELEGRAM_CHAT_ID;
  if (admin && user) {
    const until = new Date(user.plan_until).toISOString().slice(0, 10);
    await tg("sendMessage", {
      chat_id: admin,
      parse_mode: "HTML",
      text: `💰 <b>Yangi to'lov — Pro</b>\n👤 ${escapeHtml(user.name)} (${escapeHtml(user.email)})\n💳 ${order.amount.toLocaleString("ru-RU")} so'm · ${order.provider === "payme" ? "Payme" : "Click"}\n✅ Pro ${until} gacha`,
    }).catch(() => null);
  }
}

/** To'lov bekor qilindi (qaytarildi): berilgan muddat olib tashlanadi */
export async function revokePro(order: Pick<OrderRow, "user_id" | "months">) {
  await query(
    `update users set plan_until = plan_until - make_interval(months => $2::int),
       plan = case when plan_until - make_interval(months => $2::int) > now() then plan else 'free' end
     where id = $1 and plan_until is not null`,
    [order.user_id, order.months],
  );
}
