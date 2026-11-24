import type { XpClaim } from "@/entities/gamification";
import { MAX_CLAIMS, awardXp } from "@/features/xp-ledger";
import { assertSameOrigin, handleError, json, rateLimit, readJson, requireUser } from "@/shared/server";

/** Javoblarni qabul qiladi: server tekshiradi, XP'ni o'zi hisoblaydi va daftarga bir marta yozadi. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    if (!rateLimit(request, `xp:${user.id}`, 60)) return json({ error: "rate" }, 429);
    const body = await readJson<{ claims?: XpClaim[] }>(request, 200_000);
    if (!Array.isArray(body.claims) || body.claims.length > MAX_CLAIMS) return json({ error: "invalid" }, 400);
    return json({ results: await awardXp(user.id, body.claims) });
  } catch (error) {
    return handleError(error);
  }
}
