import { timingSafeEqual } from "node:crypto";

import { activatePro, billing, getOrder, orderByExt, query, queryOne, revokePro, type OrderRow } from "@/shared/server";

/**
 * Payme Merchant API (JSON-RPC 2.0). Payme kabinetida "Endpoint URL" sifatida shu manzil ko'rsatiladi:
 * https://<sayt>/api/pay/payme, hisob maydoni (account) nomi — `order_id`.
 * Javob har doim HTTP 200; xato `error` maydonida.
 */

/** Tranzaksiya 12 soatda bajarilmasa — bekor */
const TIMEOUT_MS = 12 * 60 * 60 * 1000;

const msg = (uz: string, ru: string, en: string) => ({ uz, ru, en });
const ERR = {
  auth: { code: -32504, message: msg("Ruxsat yo'q", "Недостаточно привилегий", "Insufficient privileges") },
  parse: { code: -32700, message: msg("JSON xato", "Ошибка разбора JSON", "Parse error") },
  method: { code: -32601, message: msg("Metod topilmadi", "Метод не найден", "Method not found") },
  amount: { code: -31001, message: msg("Summa noto'g'ri", "Неверная сумма", "Incorrect amount") },
  notFound: { code: -31003, message: msg("Tranzaksiya topilmadi", "Транзакция не найдена", "Transaction not found") },
  cantPerform: { code: -31008, message: msg("Amalni bajarib bo'lmaydi", "Невозможно выполнить операцию", "Unable to perform operation") },
  order: { code: -31050, message: msg("Buyurtma topilmadi", "Заказ не найден", "Order not found"), data: "order_id" },
  orderPaid: { code: -31051, message: msg("Buyurtma to'langan yoki bekor qilingan", "Заказ уже оплачен или отменён", "Order already paid or cancelled"), data: "order_id" },
  orderBusy: { code: -31052, message: msg("Buyurtma bo'yicha to'lov kutilmoqda", "Заказ ожидает оплаты", "Order is awaiting another payment"), data: "order_id" },
};

class RpcError extends Error {
  constructor(readonly error: { code: number; message: unknown; data?: string }) {
    super(String(error.code));
  }
}

const num = (v: string | number | null) => (v === null ? 0 : Number(v));

function authorized(request: Request, key: string) {
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Basic ${Buffer.from(`Paycom:${key}`).toString("base64")}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Buyurtma to'lovga yaroqlimi (summa — tiyinda) */
async function payableOrder(account: { order_id?: string } | undefined, amount: number) {
  const order = account?.order_id ? await getOrder(String(account.order_id)) : null;
  if (!order || order.provider !== "payme") throw new RpcError(ERR.order);
  if (order.status !== "new") throw new RpcError(ERR.orderPaid);
  if (amount !== order.amount * 100) throw new RpcError(ERR.amount);
  return order;
}

/** Muddati o'tgan kutilayotgan tranzaksiyani bekor qiladi (sabab 4 — vaqt tugadi) */
async function expire(order: OrderRow) {
  await query("update orders set pay_state = -1, status = 'cancelled', cancel_time = $2, cancel_reason = 4 where id = $1 and pay_state = 1", [order.id, Date.now()]);
}

const view = (o: OrderRow) => ({
  create_time: num(o.create_time),
  perform_time: num(o.perform_time),
  cancel_time: num(o.cancel_time),
  transaction: o.id,
  state: o.pay_state ?? 0,
  reason: o.cancel_reason,
});

type Params = { id?: string; time?: number; amount?: number; account?: { order_id?: string }; reason?: number; from?: number; to?: number };

async function handle(method: string, p: Params) {
  switch (method) {
    case "CheckPerformTransaction": {
      const order = await payableOrder(p.account, Number(p.amount));
      if (order.ext_id && order.pay_state === 1) throw new RpcError(ERR.orderBusy);
      return { allow: true };
    }
    case "CreateTransaction": {
      const extId = String(p.id ?? "");
      const existing = extId ? await orderByExt("payme", extId) : null;
      if (existing) {
        if (existing.pay_state !== 1) throw new RpcError(ERR.cantPerform);
        if (Date.now() - num(existing.create_time) > TIMEOUT_MS) {
          await expire(existing);
          throw new RpcError(ERR.cantPerform);
        }
        return { create_time: num(existing.create_time), transaction: existing.id, state: 1 };
      }
      const order = await payableOrder(p.account, Number(p.amount));
      if (order.ext_id) throw new RpcError(ERR.orderBusy);
      const time = Number(p.time) || Date.now();
      const row = await queryOne<OrderRow>(
        "update orders set ext_id = $2, pay_state = 1, create_time = $3 where id = $1 and ext_id is null and status = 'new' returning *",
        [order.id, extId, time],
      );
      if (!row) throw new RpcError(ERR.orderBusy);
      return { create_time: time, transaction: row.id, state: 1 };
    }
    case "PerformTransaction": {
      const order = await orderByExt("payme", String(p.id ?? ""));
      if (!order) throw new RpcError(ERR.notFound);
      if (order.pay_state === 2) return { transaction: order.id, perform_time: num(order.perform_time), state: 2 };
      if (order.pay_state !== 1) throw new RpcError(ERR.cantPerform);
      if (Date.now() - num(order.create_time) > TIMEOUT_MS) {
        await expire(order);
        throw new RpcError(ERR.cantPerform);
      }
      const now = Date.now();
      const done = await queryOne<OrderRow>(
        "update orders set pay_state = 2, status = 'paid', perform_time = $2 where id = $1 and pay_state = 1 returning *",
        [order.id, now],
      );
      // Bir vaqtda kelgan takror so'rov — natija o'sha
      if (!done) return { transaction: order.id, perform_time: num((await getOrder(order.id))?.perform_time ?? now), state: 2 };
      await activatePro(done);
      return { transaction: done.id, perform_time: now, state: 2 };
    }
    case "CancelTransaction": {
      const order = await orderByExt("payme", String(p.id ?? ""));
      if (!order) throw new RpcError(ERR.notFound);
      if (order.pay_state === -1 || order.pay_state === -2) return { transaction: order.id, cancel_time: num(order.cancel_time), state: order.pay_state };
      const now = Date.now();
      const next = order.pay_state === 2 ? -2 : -1;
      const row = await queryOne<OrderRow>(
        "update orders set pay_state = $2, status = 'cancelled', cancel_time = $3, cancel_reason = $4 where id = $1 and pay_state = $5 returning *",
        [order.id, next, now, Number(p.reason ?? 0), order.pay_state],
      );
      if (row && next === -2) await revokePro(row);
      const fresh = row ?? (await getOrder(order.id))!;
      return { transaction: fresh.id, cancel_time: num(fresh.cancel_time), state: fresh.pay_state };
    }
    case "CheckTransaction": {
      const order = await orderByExt("payme", String(p.id ?? ""));
      if (!order) throw new RpcError(ERR.notFound);
      return view(order);
    }
    case "GetStatement": {
      const rows = await query<OrderRow>(
        "select * from orders where provider = 'payme' and ext_id is not null and create_time between $1 and $2 order by create_time",
        [Number(p.from ?? 0), Number(p.to ?? 0)],
      );
      return {
        transactions: rows.map((o) => ({ id: o.ext_id, time: num(o.create_time), amount: o.amount * 100, account: { order_id: o.id }, ...view(o) })),
      };
    }
    default:
      throw new RpcError(ERR.method);
  }
}

export async function POST(request: Request) {
  const config = billing().payme;
  let id: unknown = null;
  const reply = (body: object) => Response.json({ jsonrpc: "2.0", id, ...body });
  if (!config || !authorized(request, config.key)) return reply({ error: ERR.auth });
  let body: { id?: unknown; method?: string; params?: Params };
  try {
    body = await request.json();
  } catch {
    return reply({ error: ERR.parse });
  }
  id = body.id ?? null;
  try {
    return reply({ result: await handle(String(body.method), body.params ?? {}) });
  } catch (error) {
    if (error instanceof RpcError) return reply({ error: error.error });
    console.error("[payme]", error);
    return reply({ error: { code: -32400, message: msg("Tizim xatosi", "Системная ошибка", "System error") } });
  }
}
