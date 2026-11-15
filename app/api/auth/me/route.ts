import { connection } from "next/server";
import {
  assertSameOrigin,
  deleteAccount,
  getCurrentUser,
  handleError,
  json,
  linkStatus,
  readJson,
  requireUser,
  telegramConfigured,
  updateProfile,
} from "@/shared/server";

/** Joriy foydalanuvchi va Telegram holati */
export async function GET() {
  // Har doim so'rov vaqtida bajariladi (prerender qilinmaydi)
  await connection();
  try {
    const user = await getCurrentUser();
    if (!user) return json({ user: null });
    const link = await linkStatus(user.id);
    return json({
      user,
      telegram: {
        available: telegramConfigured(),
        bot: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? null,
        linked: !!link?.chat_id,
        dailyEnabled: link?.daily_enabled ?? true,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const body = await readJson<{ name?: string; publicProfile?: boolean }>(request, 10_000);
    await updateProfile(user.id, {
      name: typeof body.name === "string" ? body.name : undefined,
      publicProfile: typeof body.publicProfile === "boolean" ? body.publicProfile : undefined,
    });
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await deleteAccount(user.id);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
