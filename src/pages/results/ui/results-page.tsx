"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { bestStreak, currentStreak, useGameState } from "@/entities/gamification";
import {
  domainPerformance,
  getPracticeTest,
  summarizeAttempt,
  useTestAttempts,
  attemptsRepository,
  type DomainStat,
  type TestAttempt,
} from "@/entities/practice-test";
import { getDomain, type DomainId, type SectionId } from "@/entities/sat";
import { routes } from "@/shared/config";
import { formatDay, useI18n } from "@/shared/i18n";
import { cn, formatDuration, toISODate } from "@/shared/lib";
import { useToday } from "@/shared/lib/react";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Card, Container } from "@/shared/ui/primitives";
import { confirmDialog } from "@/shared/ui/confirm";

import { toneOf } from "./meter";
import { ProgressChart } from "./progress-chart";
import { ActivityHeatmap, DomainChart, SectionSplit, WeeklyBars } from "./stats-charts";

function analyze(attempts: TestAttempt[]) {
  const perf = domainPerformance(attempts);
  const byDomain = (Object.entries(perf) as [DomainId, DomainStat][]).map(([id, stat]) => ({
    id,
    section: getDomain(id).sectionId,
    ...stat,
  }));
  const correct = byDomain.reduce((sum, d) => sum + d.correct, 0);
  const total = byDomain.reduce((sum, d) => sum + d.total, 0);
  const seconds = attempts.reduce((sum, a) => sum + a.durationSec, 0);
  const sectionTotals = { rw: 0, math: 0 } as Record<SectionId, number>;
  for (const d of byDomain) sectionTotals[d.section] += d.total;

  // Har bir urinish xulosasi (eng yangisi birinchi)
  const runs = attempts.flatMap((a) => {
    const test = getPracticeTest(a.testId);
    return test ? [{ attempt: a, test, summary: summarizeAttempt(test, a) }] : [];
  });
  const latest = runs[0];
  const delta = runs.length > 1 ? Math.round((runs[0].summary.accuracy - runs[1].summary.accuracy) * 100) : null;
  const best = runs.reduce((m, r) => Math.max(m, r.summary.accuracy), 0);
  const weakest = [...byDomain].sort((a, b) => a.correct / a.total - b.correct / b.total).find((d) => d.correct / d.total < 0.8);

  return { correct, total, seconds, byDomain, sectionTotals, runs, latest, delta, best, weakest };
}

/** Kunlik faollik: yangi hisoblagich + eski profillar uchun test urinishlari va faol kunlardan */
function activityCounts(attempts: TestAttempt[], activity: Record<string, number> | undefined, activeDays: string[]) {
  const counts: Record<string, number> = {};
  for (const a of attempts) {
    const day = toISODate(new Date(a.finishedAt));
    counts[day] = (counts[day] ?? 0) + (a.questionIds?.length ?? a.answers.length);
  }
  for (const [day, n] of Object.entries(activity ?? {})) counts[day] = Math.max(counts[day] ?? 0, n);
  for (const day of activeDays) counts[day] ??= 1;
  return counts;
}

const toneClass = { good: "text-success", mid: "text-warning", low: "text-danger" } as const;

export function ResultsPage() {
  const { t, locale, href } = useI18n();
  const r = t.results;
  const attempts = useTestAttempts();
  const game = useGameState();
  const today = useToday();
  const stats = useMemo(() => analyze(attempts ?? []), [attempts]);
  const counts = useMemo(
    () => activityCounts(attempts ?? [], game?.activity, game?.activeDays ?? []),
    [attempts, game?.activity, game?.activeDays],
  );

  if (attempts === undefined || !today) {
    return (
      <main className="flex-1">
        <Container className="space-y-3 py-4 sm:py-10">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-2" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-2" />
            ))}
          </div>
          <div className="h-44 animate-pulse rounded-2xl bg-surface-2" />
        </Container>
      </main>
    );
  }

  const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
  const scores = stats.latest?.summary.sectionScores ?? {};
  const latestTotal = scores.rw && scores.math ? scores.rw + scores.math : null;
  const latestText = latestTotal ?? (Object.values(scores).join(" / ") || "—");
  const activeDays = game?.activeDays ?? [];

  const kpis: { icon: IconName; label: string; value: string; sub?: string; subTone?: string }[] = [
    {
      icon: "target",
      label: r.latest,
      value: String(latestText),
      sub: latestTotal ? "/ 1600" : undefined,
    },
    {
      icon: "check",
      label: r.avgAccuracy,
      value: `${accuracy}%`,
      sub: stats.delta !== null ? `${stats.delta >= 0 ? "▲" : "▼"} ${Math.abs(stats.delta)}%` : undefined,
      subTone: stats.delta !== null ? (stats.delta >= 0 ? "text-success" : "text-danger") : undefined,
    },
    { icon: "pencil", label: r.totalTests, value: String(attempts.length), sub: `${stats.total} ${t.common.questions}` },
    { icon: "clock", label: r.totalTime, value: formatDuration(stats.seconds) },
  ];

  return (
    <main className="flex-1">
      <Container className="space-y-3 py-4 sm:space-y-5 sm:py-10">
        <header className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-4xl">{r.title}</h1>
            <p className="mt-0.5 truncate text-sm text-muted">{r.description}</p>
          </div>
          {attempts.length > 0 && (
            <ButtonLink href={href(routes.tests)} size="sm" className="shrink-0">
              <Icon name="play" className="size-3.5" /> {t.nav.tests}
            </ButtonLink>
          )}
        </header>

        {attempts.length === 0 ? (
          <Card className="p-5 sm:p-8">
            <ActivityHeatmap counts={counts} today={today} />
            <div className="mt-5 flex flex-col items-start gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold">{r.emptyTitle}</h2>
                <p className="mt-1 text-sm text-muted">{r.emptyText}</p>
              </div>
              <ButtonLink href={href(routes.tests)}>
                {r.emptyCta} <Icon name="arrowRight" className="size-4" />
              </ButtonLink>
            </div>
          </Card>
        ) : (
          <>
            {/* ---------- Asosiy ko'rsatkichlar ---------- */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
              {kpis.map((k, i) => (
                <div
                  key={k.label}
                  className={cn(
                    "rounded-2xl border p-3.5 shadow-card sm:rounded-3xl sm:p-5",
                    i === 0 ? "border-transparent bg-ink text-white" : "border-border bg-surface",
                  )}
                >
                  <p className={cn("flex items-center gap-1.5 text-xs", i === 0 ? "text-white/75" : "text-muted")}>
                    <Icon name={k.icon} className="size-3.5" />
                    <span className="truncate">{k.label}</span>
                  </p>
                  <p className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="font-display text-2xl leading-none font-bold tabular-nums sm:text-3xl">{k.value}</span>
                    {k.sub && (
                      <span className={cn("truncate text-xs font-semibold tabular-nums", k.subTone ?? (i === 0 ? "text-white/60" : "text-muted"))}>
                        {k.sub}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* ---------- Faollik (GitHub contribution graph) ---------- */}
            <Card className="p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-bold">{r.activityTitle}</h2>
                <div className="flex gap-3 text-xs text-muted">
                  <span title={r.streakNow} className="inline-flex items-center gap-1">
                    <Icon name="flame" className="size-3.5 text-warning" />
                    <strong className="text-fg tabular-nums">{currentStreak(activeDays, today)}</strong>
                  </span>
                  <span title={r.streakBest} className="inline-flex items-center gap-1">
                    <Icon name="trophy" className="size-3.5" />
                    <strong className="text-fg tabular-nums">{bestStreak(activeDays)}</strong>
                  </span>
                  <span title={r.activeDays} className="hidden items-center gap-1 sm:inline-flex">
                    <Icon name="calendar" className="size-3.5" />
                    <strong className="text-fg tabular-nums">{activeDays.length}</strong> {r.activeDays.toLowerCase()}
                  </span>
                </div>
              </div>
              <ActivityHeatmap counts={counts} today={today} />
            </Card>

            <div className="grid gap-3 sm:gap-5 lg:grid-cols-2">
              <Card className="p-4 sm:p-6">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h2 className="font-bold">{r.weeklyTitle}</h2>
                  <p className="text-xs text-muted">{r.weeklyHint}</p>
                </div>
                <WeeklyBars counts={counts} today={today} />
              </Card>

              {stats.runs.length > 1 && (
                <Card className="p-4 sm:p-6">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <h2 className="font-bold">{r.chartTitle}</h2>
                    <p className="text-xs text-muted">{r.chartHint}</p>
                  </div>
                  <ProgressChart
                    valueLabel={r.chartTitle}
                    avgLabel={r.avgAccuracy}
                    points={[...stats.runs]
                      .reverse()
                      .slice(-20)
                      .map(({ attempt, test, summary }) => ({
                        label: test.title[locale],
                        date: formatDay(toISODate(new Date(attempt.finishedAt)), locale),
                        value: Math.round(summary.accuracy * 100),
                      }))}
                  />
                </Card>
              )}
            </div>

            {/* ---------- Mavzular ---------- */}
            <Card className="p-4 sm:p-6">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h2 className="font-bold">{r.byDomain}</h2>
                <p className="hidden text-xs text-muted sm:block">{r.domainHint}</p>
              </div>
              <SectionSplit rw={stats.sectionTotals.rw} math={stats.sectionTotals.math} />
              <div className="mt-5">
                <DomainChart
                  rows={stats.byDomain.map((d) => ({ id: d.id, label: t.domains[d.id], section: d.section, correct: d.correct, total: d.total }))}
                />
              </div>
              {stats.weakest && (
                <div className="mt-5 flex items-center gap-3 rounded-xl bg-warning-soft p-3">
                  <Icon name="flame" className="size-4 shrink-0 text-warning" />
                  <p className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold">{t.domains[stats.weakest.id]}</span>{" "}
                    <span className="text-muted tabular-nums">· {Math.round((stats.weakest.correct / stats.weakest.total) * 100)}%</span>
                  </p>
                  <ButtonLink href={href(routes.practice)} size="sm" variant="outline" className="shrink-0 bg-surface">
                    {t.nav.practiceShort} <Icon name="arrowRight" className="size-3.5" />
                  </ButtonLink>
                </div>
              )}
            </Card>

            <HistoryCard runs={stats.runs} />
          </>
        )}
      </Container>
    </main>
  );
}

type Run = ReturnType<typeof analyze>["runs"][number];

/** Ixcham tarix: oxirgi 5 ta, qolgani so'ralganda */
function HistoryCard({ runs }: { runs: Run[] }) {
  const { t, locale, href } = useI18n();
  const r = t.results;
  const [all, setAll] = useState(false);
  // Sana loyiha formatida (o'zbekcha brauzerlarda bir xil emas) + vaqt
  const fmt = {
    format: (d: Date) =>
      `${formatDay(toISODate(d), locale)}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
  const shown = all ? runs : runs.slice(0, 5);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="flex items-center gap-2 font-bold">
          {r.history}
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent tabular-nums">{runs.length}</span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted hover:bg-danger-soft hover:text-danger"
          onClick={async () => (await confirmDialog({ title: r.confirmClear, tone: "danger" })) && attemptsRepository.clear()}
          aria-label={r.clear}
        >
          <Icon name="trash" className="size-4" />
          <span className="hidden sm:inline">{r.clear}</span>
        </Button>
      </div>
      <ul className="divide-y divide-border border-t border-border">
        {shown.map(({ attempt, test, summary }) => {
          const pct = Math.round(summary.accuracy * 100);
          const sections = Object.entries(summary.sectionScores) as [SectionId, number][];
          return (
            <li key={attempt.id}>
              <Link prefetch
                href={href(test.simulation ? routes.simulator : routes.test(test.id))}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2/60 sm:px-6"
              >
                <span className={cn("w-11 shrink-0 font-display text-lg font-bold tabular-nums", toneClass[toneOf(pct)])}>{pct}%</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{test.title[locale]}</p>
                  <p className="truncate text-xs text-muted tabular-nums">
                    {fmt.format(new Date(attempt.finishedAt))} · {summary.correct}/{summary.total}
                  </p>
                </div>
                <div className="hidden shrink-0 gap-1.5 sm:flex">
                  {sections.map(([sec, score]) => (
                    <span key={sec} className="rounded-lg bg-surface-2 px-2 py-1 text-xs font-semibold tabular-nums">
                      {sec === "rw" ? "R&W" : "Math"} {score}
                    </span>
                  ))}
                </div>
                <Icon name="arrowRight" className="size-4 shrink-0 text-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
      {runs.length > 5 && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="w-full border-t border-border py-3 text-sm font-semibold text-accent transition hover:bg-surface-2/60"
        >
          {all ? r.showLess : `${r.showAll} (${runs.length})`}
        </button>
      )}
    </Card>
  );
}
