import { assertSameOrigin, handleError, json, rateLimit, readJson, startSession, verifyCredentials } from "@/shared/server";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (!rateLimit(request, "login", 10)) return json({ error: "rate" }, 429);
    const body = await readJson<{ email?: string; password?: string }>(request, 10_000);
    const id = await verifyCredentials(String(body.email ?? ""), String(body.password ?? ""));
    await startSession(id);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
