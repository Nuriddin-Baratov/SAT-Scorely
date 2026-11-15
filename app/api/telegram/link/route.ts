import { hasLocale } from "@/shared/i18n";
import { assertSameOrigin, createLinkCode, handleError, json, readJson, requireUser, telegramConfigured, unlink } from "@/shared/server";

/** Botga ulash uchun bir martalik havola: t.me/<bot>?start=<kod> */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    if (!telegramConfigured() || !bot) return json({ error: "not-configured" }, 503);
    const body = await readJson<{ locale?: string }>(request, 1_000).catch(() => ({ locale: undefined }));
    const code = await createLinkCode(user.id, hasLocale(body.locale) ? body.locale : "uz");
    return json({ url: `https://t.me/${bot}?start=${code}` });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await unlink(user.id);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
