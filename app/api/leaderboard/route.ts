import { connection, type NextRequest } from "next/server";

import { getCurrentUser, handleError, json, leaderboard, studentClasses } from "@/shared/server";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** `?scope=week|all&weekStart=YYYY-MM-DD&class=<id>` */
export async function GET(request: NextRequest) {
  // Har doim so'rov vaqtida bajariladi (prerender qilinmaydi)
  await connection();
  try {
    const params = request.nextUrl.searchParams;
    const scope = params.get("scope") === "all" ? "all" : "week";
    const weekStart = DAY_RE.test(params.get("weekStart") ?? "") ? params.get("weekStart")! : new Date().toISOString().slice(0, 10);
    const user = await getCurrentUser();

    // Sinf reytingi faqat a'zolar uchun
    let classId: string | undefined;
    const requested = params.get("class");
    if (requested && user) {
      const mine = await studentClasses(user.id);
      if (mine.some((c) => c.id === requested)) classId = requested;
    }

    const rows = await leaderboard(scope, weekStart, classId);
    return json({
      rows: rows.map((r, i) => ({ rank: i + 1, name: r.name, xp: r.xp, weeklyXp: r.weeklyXp, streak: r.streak, me: r.userId === user?.id })),
    });
  } catch (error) {
    return handleError(error);
  }
}
