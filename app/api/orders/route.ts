import { connection } from "next/server";

import {
  PRO_PRICE,
  aiStatus,
  assertSameOrigin,
  billing,
  createOrder,
  databaseConfigured,
  getCurrentUser,
  handleError,
  json,
  rateLimit,
  readJson,
  requireUser,
  userOrder,
  type Provider,
} from "@/shared/server";

/** Tariflar sahifasi uchun: ulangan to'lov tizimlari, narx, joriy tarif; `?id=` — buyurtma holati */
export async function GET(request: Request) {
  await connection();
  try {
    const { providers } = billing();
    const base = { providers, price: PRO_PRICE };
    if (!databaseConfigured()) return json({ ...base, user: false });
    const user = await getCurrentUser();
    if (!user) return json({ ...base, user: false });
    const orderId = new URL(request.url).searchParams.get("id");
    const [status, order] = await Promise.all([aiStatus(user.id), orderId ? userOrder(orderId, user.id) : null]);
    return json({ ...base, user: true, plan: status.plan, planUntil: status.planUntil, order: order ?? null });
  } catch (error) {
    return handleError(error);
  }
}

/** Buyurtma yaratadi va to'lov sahifasi manzilini qaytaradi */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    if (!rateLimit(request, `order:${user.id}`, 10)) return json({ error: "rate" }, 429);
    const body = await readJson<{ provider?: string; locale?: string }>(request, 1000);
    const config = billing();
    const provider = body.provider as Provider;
    if (!config.providers.includes(provider)) return json({ error: "unavailable" }, 400);

    const locale = ["uz", "ru", "en"].includes(String(body.locale)) ? String(body.locale) : "uz";
    const id = await createOrder(user.id, provider);
    const site = (process.env.APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
    const back = `${site}/${locale}/plans?order=${id}`;

    let url: string;
    if (provider === "payme") {
      const p = config.payme!;
      const params = `m=${p.merchantId};ac.order_id=${id};a=${PRO_PRICE * 100};c=${back};l=${locale === "en" ? "en" : locale === "ru" ? "ru" : "uz"}`;
      url = `https://checkout${p.test ? ".test" : ""}.paycom.uz/${Buffer.from(params).toString("base64")}`;
    } else {
      const c = config.click!;
      const q = new URLSearchParams({ service_id: c.serviceId, merchant_id: c.merchantId, amount: String(PRO_PRICE), transaction_param: id, return_url: back });
      url = `https://my.click.uz/services/pay?${q}`;
    }
    return json({ id, url });
  } catch (error) {
    return handleError(error);
  }
}
