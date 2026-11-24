import { api } from "@/shared/api";
import { addDays, toISODate, weekdayIndex } from "@/shared/lib";

export interface LeaderboardRow {
  rank: number;
  name: string;
  xp: number;
  weeklyXp: number;
  streak: number;
  me: boolean;
}

export type LeaderboardScope = "week" | "all";

/** Oxirgi ko'rilgan reyting: sahifa shu bilan darhol ochiladi, yangisi orqa fonda keladi. */
const cache = new Map<string, LeaderboardRow[]>();
const keyOf = (scope: LeaderboardScope, classId: string) => `${scope}|${classId}`;

export const cachedLeaderboard = (scope: LeaderboardScope, classId: string) => cache.get(keyOf(scope, classId)) ?? null;

export async function loadLeaderboard(scope: LeaderboardScope, classId: string) {
  const now = new Date();
  const weekStart = toISODate(addDays(now, -weekdayIndex(now)));
  const params = new URLSearchParams({ scope, weekStart, ...(classId ? { class: classId } : {}) });
  const { rows } = await api<{ rows: LeaderboardRow[] }>(`/api/leaderboard?${params}`, { cache: "no-store" });
  cache.set(keyOf(scope, classId), rows);
  return rows;
}

/** Ilova ochilgach orqa fonda: reyting sahifasi bosilganda ma'lumot tayyor turadi. */
export function preloadLeaderboard() {
  for (const scope of ["week", "all"] as const) {
    if (!cachedLeaderboard(scope, "")) loadLeaderboard(scope, "").catch(() => {});
  }
}
