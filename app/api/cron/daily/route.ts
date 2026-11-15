import { broadcastDaily } from "@/features/telegram-bot";

/**
 * Kunlik savol tarqatmasi. Vercel Cron (`vercel.json`) har kuni chaqiradi va
 * `Authorization: Bearer <CRON_SECRET>` sarlavhasini yuboradi.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const sent = await broadcastDaily();
  return Response.json({ sent });
}
