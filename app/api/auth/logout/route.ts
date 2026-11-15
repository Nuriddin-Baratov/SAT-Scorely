import { assertSameOrigin, endSession, handleError, json } from "@/shared/server";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await endSession();
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
