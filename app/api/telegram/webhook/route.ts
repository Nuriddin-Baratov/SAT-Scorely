import { timingSafeEqual } from "node:crypto";

import { handleUpdate } from "@/features/telegram-bot";

/**
 * Telegram webhook. `setWebhook` da berilgan `secret_token` har bir so'rovda
 * `X-Telegram-Bot-Api-Secret-Token` sarlavhasida keladi — shu bilan haqiqiyligini tekshiramiz.
 */
export async function POST(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const given = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!expected || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return new Response("forbidden", { status: 403 });
  }
  try {
    await handleUpdate(await request.json());
  } catch (error) {
    // Telegram qayta yubormasligi uchun baribir 200 qaytaramiz
    console.error("[telegram] update failed", error);
  }
  return new Response("ok");
}
