import { createHash, timingSafeEqual } from "node:crypto";

import { activatePro, billing, getOrder, queryOne, type OrderRow } from "@/shared/server";

/**
 * Click SHOP API. Click kabinetida "Prepare URL" va "Complete URL" — ikkalasi ham shu manzil:
 * https://<sayt>/api/pay/click (bosqich `action` maydonidan aniqlanadi: 0 — Prepare, 1 — Complete).
 */

const md5 = (s: string) => createHash("md5").update(s).digest("hex");

const ERR = {
  sign: [-1, "SIGN CHECK FAILED"],
  amount: [-2, "Incorrect parameter amount"],
  action: [-3, "Action not found"],
  paid: [-4, "Already paid"],
  order: [-5, "Order does not exist"],
  transaction: [-6, "Transaction does not exist"],
  request: [-8, "Error in request from click"],
  cancelled: [-9, "Transaction cancelled"],
} as const;

export async function POST(request: Request) {
  const config = billing().click;
  const form = await request.formData().catch(() => null);
  const f = (key: string) => String(form?.get(key) ?? "");
  const base = { click_trans_id: f("click_trans_id"), merchant_trans_id: f("merchant_trans_id") };
  const fail = ([error, note]: readonly [number, string]) => Response.json({ ...base, error, error_note: note });

  if (!config || !form) return fail(ERR.request);
  const action = f("action");
  if (action !== "0" && action !== "1") return fail(ERR.action);

  // Imzo: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id [+ merchant_prepare_id] + amount + action + sign_time)
  const signed = md5(
    f("click_trans_id") + f("service_id") + config.secret + f("merchant_trans_id") + (action === "1" ? f("merchant_prepare_id") : "") + f("amount") + action + f("sign_time"),
  );
  const given = Buffer.from(f("sign_string"));
  if (given.length !== signed.length || !timingSafeEqual(given, Buffer.from(signed)) || f("service_id") !== config.serviceId) return fail(ERR.sign);

  const order = await getOrder(f("merchant_trans_id"));
  if (!order || order.provider !== "click") return fail(ERR.order);
  if (Math.abs(Number(f("amount")) - order.amount) > 0.001) return fail(ERR.amount);

  if (action === "0") {
    if (order.status === "paid") return fail(ERR.paid);
    if (order.status === "cancelled") return fail(ERR.cancelled);
    await queryOne("update orders set ext_id = $2, create_time = $3 where id = $1 and status = 'new'", [order.id, f("click_trans_id"), Date.now()]);
    return Response.json({ ...base, merchant_prepare_id: Number(order.seq), error: 0, error_note: "Success" });
  }

  // Complete
  if (f("merchant_prepare_id") !== String(order.seq) || order.ext_id !== f("click_trans_id")) return fail(ERR.transaction);
  if (order.status === "paid") return fail(ERR.paid);
  if (order.status === "cancelled") return fail(ERR.cancelled);
  // Click tomonida to'lov o'tmadi — buyurtma bekor
  if (Number(f("error")) < 0) {
    await queryOne("update orders set status = 'cancelled', cancel_time = $2 where id = $1 and status = 'new'", [order.id, Date.now()]);
    return fail(ERR.cancelled);
  }
  const done = await queryOne<OrderRow>("update orders set status = 'paid', perform_time = $2 where id = $1 and status = 'new' returning *", [order.id, Date.now()]);
  if (!done) return fail(ERR.paid);
  await activatePro(done);
  return Response.json({ ...base, merchant_confirm_id: Number(done.seq), error: 0, error_note: "Success" });
}
