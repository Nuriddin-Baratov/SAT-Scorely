import { assertSameOrigin, handleError, joinClass, json, rateLimit, readJson, requireUser } from "@/shared/server";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (!rateLimit(request, "join-class", 10)) return json({ error: "rate" }, 429);
    const user = await requireUser();
    const body = await readJson<{ code?: string }>(request, 2_000);
    const cls = await joinClass(user.id, String(body.code ?? ""));
    return json({ ok: true, class: cls });
  } catch (error) {
    return handleError(error);
  }
}
