import "server-only";

import { AuthError } from "./auth";
import { DatabaseUnavailableError } from "./db";

/** JSON javob */
export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** Xatolarni bir xil formatda qaytaradi: `{ error: "code" }` */
export function handleError(error: unknown) {
  if (error instanceof AuthError) {
    const status = error.code === "unauthorized" ? 401 : error.code === "forbidden" ? 403 : error.code === "exists" ? 409 : 400;
    return json({ error: error.code }, status);
  }
  if (error instanceof SyntaxError) return json({ error: "invalid" }, 400);
  if (error instanceof DatabaseUnavailableError) return json({ error: "no-database" }, 503);
  console.error(error);
  return json({ error: "server" }, 500);
}

/** So'rov tanasini xavfsiz o'qish (hajmi cheklangan) */
export async function readJson<T>(request: Request, maxBytes = 2_000_000): Promise<T> {
  const text = await request.text();
  if (text.length > maxBytes) throw new AuthError("invalid");
  return JSON.parse(text) as T;
}

/** Bir xil IP'dan juda ko'p urinishlarni cheklash (xotirada, bitta server nusxasi uchun) */
const hits = new Map<string, { count: number; reset: number }>();
export function rateLimit(request: Request, key: string, limit = 10, windowMs = 60_000) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const id = `${key}:${ip}`;
  const now = Date.now();
  // Muddati o'tgan yozuvlarni vaqti-vaqti bilan tozalaymiz — aks holda har bir yangi IP xotirada abadiy qoladi
  if (hits.size > 1000) for (const [key, value] of hits) if (value.reset < now) hits.delete(key);
  const entry = hits.get(id);
  if (!entry || entry.reset < now) {
    hits.set(id, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}

/** O'zgartiruvchi so'rovlar faqat shu saytdan kelishi kerak (CSRF himoyasi) */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return; // brauzer bo'lmagan mijozlar (curl va h.k.) — cookie bo'lmasa baribir ruxsat yo'q
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (new URL(origin).host !== host) throw new AuthError("forbidden");
}
