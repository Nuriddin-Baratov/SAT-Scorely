import { connection } from "next/server";
import { assertSameOrigin, handleError, json, loadSnapshot, readJson, requireUser, saveSnapshot } from "@/shared/server";

/** Bulutdagi nusxa */
export async function GET() {
  // Har doim so'rov vaqtida bajariladi (prerender qilinmaydi)
  await connection();
  try {
    const user = await requireUser();
    const row = await loadSnapshot(user.id);
    return json({ snapshot: row?.snapshot ?? null, updatedAt: row?.updated_at ?? null, version: Number(row?.version ?? 0), xp: Number(row?.xp ?? 0) });
  } catch (error) {
    return handleError(error);
  }
}

/** Brauzerdagi ma'lumotlarni bulutga saqlash */
export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const body = await readJson<{ snapshot?: unknown; baseVersion?: unknown }>(request);
    const baseVersion = Number.isInteger(body.baseVersion) ? (body.baseVersion as number) : undefined;
    const version = await saveSnapshot(user.id, body.snapshot, baseVersion);
    // Boshqa qurilma oldinroq yozgan — mijoz yangi nusxani olib, birlashtirib qayta yuboradi
    if (version === null) return json({ error: "conflict" }, 409);
    return json({ ok: true, version, savedAt: new Date().toISOString() });
  } catch (error) {
    return handleError(error);
  }
}
