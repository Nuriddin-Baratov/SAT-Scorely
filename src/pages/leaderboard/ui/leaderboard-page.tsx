"use client";

import { useEffect, useState } from "react";

import { useSession } from "@/entities/user";
import { api } from "@/shared/api";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { addDays, cn, toISODate, weekdayIndex } from "@/shared/lib";
import { ButtonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Card, Container, SectionHeading } from "@/shared/ui/primitives";

interface Row {
  rank: number;
  name: string;
  xp: number;
  weeklyXp: number;
  streak: number;
  me: boolean;
}

type Scope = "week" | "all";

function weekStart() {
  const now = new Date();
  return toISODate(addDays(now, -weekdayIndex(now)));
}

export function LeaderboardPage() {
  const { t, href } = useI18n();
  const l = t.leaderboard;
  const session = useSession();
  const [scope, setScope] = useState<Scope>("week");
  const [classId, setClassId] = useState<string>("");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  const userRole = session.status === "user" ? session.user.role : null;

  useEffect(() => {
    if (userRole !== "student") return;
    let cancelled = false;
    api<{ classes: { id: string; name: string }[] }>("/api/classes", { cache: "no-store" })
      .then((d) => !cancelled && setClasses(d.classes))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userRole]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ scope, weekStart: weekStart(), ...(classId ? { class: classId } : {}) });
    api<{ rows: Row[] }>(`/api/leaderboard?${params}`, { cache: "no-store" })
      .then((d) => {
        if (cancelled) return;
        setRows(d.rows);
        setFailed(false);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [scope, classId, session.status]);

  const medal = ["bg-[#bfdbfe] text-ink", "bg-zinc-300 text-ink", "bg-[#d79b6a] text-ink"];

  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative max-w-4xl py-5 sm:py-16">
        <SectionHeading eyebrow={l.eyebrow} title={l.title} description={l.description} />

        <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-10">
          <div className="inline-flex rounded-full bg-surface-2 p-1" role="tablist">
            {(["week", "all"] as const).map((sc) => (
              <button
                key={sc}
                type="button"
                role="tab"
                aria-selected={scope === sc}
                onClick={() => setScope(sc)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium transition",
                  scope === sc ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
                )}
              >
                {sc === "week" ? l.week : l.all}
              </button>
            ))}
          </div>
          {classes.length > 0 && (
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              aria-label={l.classFilter}
              className="h-10 rounded-full border border-border bg-surface px-4 text-sm"
            >
              <option value="">{l.everyone}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {session.status === "guest" && (
          <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="text-sm text-muted">{l.guestHint}</p>
            <ButtonLink href={href(routes.login)} size="sm">
              {t.auth.login}
            </ButtonLink>
          </Card>
        )}

        <Card className="mt-6 overflow-hidden">
          {failed || session.status === "offline" ? (
            <p className="p-10 text-center text-muted">{l.unavailable}</p>
          ) : rows === null ? (
            <div className="h-64 animate-pulse bg-surface-2" />
          ) : rows.length === 0 ? (
            <p className="p-10 text-center text-muted">{l.empty}</p>
          ) : (
            <ol className="divide-y divide-border">
              {rows.map((r) => (
                <li key={`${r.rank}-${r.name}`} className={cn("flex items-center gap-4 px-5 py-4", r.me && "bg-accent-soft/60")}>
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums",
                      medal[r.rank - 1] ?? "bg-surface-2 text-muted",
                    )}
                  >
                    {r.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {r.name}
                    {r.me && <span className="ml-2 text-xs font-semibold text-accent">({l.you})</span>}
                  </span>
                  <span className="hidden items-center gap-1 text-sm text-muted sm:inline-flex" title={t.game.streak}>
                    <Icon name="flame" className="size-4 text-warning" /> {r.streak}
                  </span>
                  <span className="w-24 text-right font-display text-lg font-bold tabular-nums">
                    {scope === "week" ? r.weeklyXp : r.xp}
                    <span className="ml-1 text-xs font-medium text-muted">XP</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <p className="mt-4 text-xs text-muted">{l.privacy}</p>
      </Container>
    </main>
  );
}
