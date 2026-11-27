import { connection } from "next/server";

import { notifyAdmin } from "@/features/telegram-bot";
import {
  PRO_PRICE,
  aiStatus,
  assertSameOrigin,
  createPayment,
  databaseConfigured,
  deletePayment,
  getCurrentUser,
  handleError,
  json,
  latestPayment,
  payConfig,
  rateLimit,
  readJson,
  requireUser,
} from "@/shared/server";

const MAX_RECEIPT = 4 * 1024 * 1024;

/** To'lov ma'lumoti: karta, narx, tarif va oxirgi to'lov holati */
export async function GET() {
  await connection();
  try {
    const config = payConfig();
    const base = { available: config.ready, price: PRO_PRICE };
    if (!databaseConfigured()) return json({ ...base, user: false });
    const user = await getCurrentUser();
    if (!user) return json({ ...base, user: false });
    const [status, last] = await Promise.all([aiStatus(user.id), latestPayment(user.id)]);
    return json({
      ...base,
      user: true,
      plan: status.plan,
      planUntil: status.planUntil,
      // Karta raqami faqat kirgan foydalanuvchiga
      card: config.ready ? { number: config.card, holder: config.holder } : null,
      latest: last ? { status: last.status, createdAt: last.created_at } : null,
    });
  } catch (error) {
    return handleError(error);
  }
}

/** Chekni qabul qiladi va adminga Telegram orqali yuboradi */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    if (!payConfig().ready) return json({ error: "unavailable" }, 503);
    if (!rateLimit(request, `pay:${user.id}`, 3, 10 * 60_000)) return json({ error: "rate" }, 429);

    const body = await readJson<{ image?: string }>(request, 6_000_000);
    const receipt = typeof body.image === "string" ? Buffer.from(body.image, "base64") : null;
    // Brauzer chekni JPEG'ga aylantirib yuboradi
    if (!receipt || receipt.length < 1000 || receipt.length > MAX_RECEIPT || receipt[0] !== 0xff || receipt[1] !== 0xd8) {
      return json({ error: "invalid" }, 400);
    }

    const id = await createPayment(user.id);
    if (!id) return json({ error: "pending" }, 409);
    if (!(await notifyAdmin({ id, userId: user.id, amount: PRO_PRICE }, receipt))) {
      await deletePayment(id);
      return json({ error: "telegram" }, 502);
    }
    return json({ status: "pending" });
  } catch (error) {
    return handleError(error);
  }
}
