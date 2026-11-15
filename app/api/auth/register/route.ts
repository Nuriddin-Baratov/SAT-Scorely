import { assertSameOrigin, handleError, json, rateLimit, readJson, registerUser, startSession, type Role } from "@/shared/server";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (!rateLimit(request, "register", 5)) return json({ error: "rate" }, 429);
    const body = await readJson<{ name?: string; email?: string; password?: string; role?: Role }>(request, 10_000);
    const id = await registerUser({
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      role: body.role === "teacher" ? "teacher" : "student",
    });
    await startSession(id);
    return json({ ok: true }, 201);
  } catch (error) {
    return handleError(error);
  }
}
