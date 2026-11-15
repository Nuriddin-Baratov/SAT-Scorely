import { connection } from "next/server";
import { assertSameOrigin, handleError, json, loadSnapshot, readJson, requireUser, saveSnapshot, type SyncStats } from "@/shared/server";

/** Bulutdagi nusxa */
export async function GET() {
  // Har doim so'rov vaqtida bajariladi (prerender qilinmaydi)
  await connection();
  try {
    const user = await requireUser();
    const row = await loadSnapshot(user.id);
    return json({ snapshot: row?.snapshot ?? null, updatedAt: row?.updated_at ?? null });
  } catch (error) {
    return handleError(error);
  }
}

/** Brauzerdagi ma'lumotlarni bulutga saqlash */
export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const body = await readJson<{ snapshot?: unknown; stats?: SyncStats }>(request);
    if (!body.stats) return json({ error: "invalid" }, 400);
    await saveSnapshot(user.id, body.snapshot, body.stats);
    return json({ ok: true, savedAt: new Date().toISOString() });
  } catch (error) {
    return handleError(error);
  }
}
