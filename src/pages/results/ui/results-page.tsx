"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  domainPerformance,
  getPracticeTest,
  summarizeAttempt,
  useTestAttempts,
  attemptsRepository,
  type DomainStat,
  type TestAttempt,
} from "@/entities/practice-test";
import { getDomain, type DomainId } from "@/entities/sat";
import { routes } from "@/shared/config";
import { localeTags, useI18n } from "@/shared/i18n";
import { cn, formatDuration } from "@/shared/lib";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Card, Container, IconTile, ProgressBar, SectionHeading } from "@/shared/ui/primitives";

import { ProgressChart } from "./progress-chart";

/** Haqiqiy SAT'da bitta savolga ajratilgan o'rtacha vaqt (soniya) */
const TARGET_PACE: Record<"rw" | "math", number> = { rw: 71, math: 95 };

function analyze(attempts: TestAttempt[]) {
  const perf = domainPerformance(attempts);
  const byDomain = (Object.entries(perf) as [DomainId, DomainStat][])
    .map(([id, stat]) => ({ id, ...stat }))
    .sort((a, b) => a.correct / a.total - b.correct / b.total);
  const correct = byDomain.reduce((sum, d) => sum + d.correct, 0);
  const total = byDomain.reduce((sum, d) => sum + d.total, 0);
  const seconds = attempts.reduce((sum, a) => sum + a.durationSec, 0);
  const pace = byDomain
    .filter((d) => d.timed > 0)
    .map((d) => {
      const target = TARGET_PACE[getDomain(d.id).sectionId];
      return { id: d.id, avg: Math.round(d.seconds / d.timed), target };
    })
    .sort((a, b) => b.avg / b.target - a.avg / a.target);
  return { correct, total, seconds, byDomain, pace, weakest: byDomain.find((d) => d.correct / d.total < 0.8) };
}

export function ResultsPage() {
  const { t, locale, href } = useI18n();
  const attempts = useTestAttempts();
  const stats = useMemo(() => analyze(attempts ?? []), [attempts]);
  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(localeTags[locale], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    [locale],
  );

  const shortDate = useMemo(() => new Intl.DateTimeFormat(localeTags[locale], { day: "numeric", month: "short" }), [locale]);

  const kpis: { icon: IconName; tone: "accent" | "gold" | "success" | "warning"; label: string; value: string }[] = [
    { icon: "pencil", tone: "accent", label: t.results.totalTests, value: String(attempts?.length ?? 0) },
    {
      icon: "target",
      tone: "success",
      label: t.results.avgAccuracy,
      value: stats.total ? `${Math.round((stats.correct / stats.total) * 100)}%` : "—",
    },
    { icon: "list", tone: "gold", label: t.results.totalQuestions, value: String(stats.total) },
    { icon: "clock", tone: "warning", label: t.results.totalTime, value: formatDuration(stats.seconds) },
  ];

  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-12 sm:py-16">
        <SectionHeading eyebrow={t.results.eyebrow} title={t.results.title} description={t.results.description} />

        {attempts === undefined ? (
          <div className="mt-12 h-64 animate-pulse rounded-3xl bg-surface-2" />
        ) : attempts.length === 0 ? (
          <Card className="mt-12 flex flex-col items-center px-6 py-16 text-center">
            <IconTile className="size-16 rounded-[1.25rem]">
              <Icon name="chart" className="size-7" />
            </IconTile>
            <h2 className="mt-6 text-2xl font-bold">{t.results.emptyTitle}</h2>
            <p className="mt-2 max-w-md text-muted">{t.results.emptyText}</p>
            <ButtonLink href={href(routes.tests)} className="mt-8">
              {t.results.emptyCta} <Icon name="arrowRight" className="size-4" />
            </ButtonLink>
          </Card>
        ) : (
          <div className="mt-12 space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {kpis.map((k) => (
                <Card key={k.label} className="flex items-center gap-4 p-5">
                  <IconTile tone={k.tone}>
                    <Icon name={k.icon} />
                  </IconTile>
                  <div className="min-w-0">
                    <p className="font-display text-2xl font-bold tabular-nums">{k.value}</p>
                    <p className="truncate text-sm text-muted">{k.label}</p>
                  </div>
                </Card>
              ))}
            </div>

            {attempts.length > 1 && (
              <Card className="p-6 sm:p-7">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold">{t.results.chartTitle}</h2>
                  <p className="text-sm text-muted">{t.results.chartHint}</p>
                </div>
                <div className="mt-5">
                  <ProgressChart
                    valueLabel={t.results.chartTitle}
                    points={[...attempts]
                      .reverse()
                      .slice(-20)
                      .flatMap((a) => {
                        const test = getPracticeTest(a.testId);
                        if (!test) return [];
                        return [
                          {
                            label: test.title[locale],
                            date: shortDate.format(new Date(a.finishedAt)),
                            value: Math.round(summarizeAttempt(test, a).accuracy * 100),
                          },
                        ];
                      })}
                  />
                </div>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <Card className="p-6 sm:p-7">
                <h2 className="text-lg font-bold">{t.results.byDomain}</h2>
                <ul className="mt-6 space-y-5">
                  {stats.byDomain.map((d) => {
                    const pct = Math.round((d.correct / d.total) * 100);
                    return (
                      <li key={d.id}>
                        <div className="mb-2 flex justify-between gap-4 text-sm">
                          <span className="font-medium">{t.domains[d.id]}</span>
                          <span className="shrink-0 text-muted tabular-nums">
                            {d.correct}/{d.total} · <strong className="text-fg">{pct}%</strong>
                          </span>
                        </div>
                        <ProgressBar value={pct} tone={pct >= 80 ? "success" : pct >= 50 ? "gold" : "accent"} label={t.domains[d.id]} />
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <div className="space-y-6">
                {stats.weakest && (
                  <Card className="border-warning/30 bg-warning-soft p-6">
                    <p className="flex items-center gap-2 text-sm font-semibold text-warning">
                      <Icon name="flame" className="size-4" /> {t.results.weakest}
                    </p>
                    <p className="mt-2 leading-relaxed">
                      {t.results.weakText(
                        t.domains[stats.weakest.id],
                        Math.round((stats.weakest.correct / stats.weakest.total) * 100),
                      )}
                    </p>
                    <ButtonLink href={href(routes.dashboard)} size="sm" variant="outline" className="mt-4">
                      {t.nav.dashboard} <Icon name="arrowRight" className="size-4" />
                    </ButtonLink>
                  </Card>
                )}
                <Card className="p-6">
                  <p className="text-sm text-muted">{t.home.tools.items.tests.text}</p>
                  <ButtonLink href={href(routes.tests)} className="mt-4">
                    <Icon name="pencil" className="size-4" /> {t.nav.tests}
                  </ButtonLink>
                </Card>
              </div>
            </div>

            {stats.pace.length > 0 && (
              <Card className="p-6 sm:p-7">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold">{t.results.paceTitle}</h2>
                  <p className="text-sm text-muted">{t.results.paceHint}</p>
                </div>
                <ul className="mt-6 grid gap-x-8 gap-y-4 md:grid-cols-2">
                  {stats.pace.map((p) => {
                    const slow = p.avg > p.target;
                    const scale = Math.max(p.avg, p.target) * 1.25;
                    return (
                      <li key={p.id}>
                        <div className="mb-2 flex justify-between gap-4 text-sm">
                          <span className="font-medium">{t.domains[p.id]}</span>
                          <span className={cn("shrink-0 tabular-nums", slow ? "text-warning" : "text-success")}>
                            {t.results.paceValue(p.avg, p.target)}
                          </span>
                        </div>
                        <div className="relative h-2 rounded-full bg-surface-2">
                          <div
                            className={cn("h-full rounded-full", slow ? "bg-warning" : "bg-success")}
                            style={{ width: `${(p.avg / scale) * 100}%` }}
                          />
                          <span
                            className="absolute -top-1 h-4 w-0.5 rounded bg-fg/60"
                            style={{ left: `${(p.target / scale) * 100}%` }}
                            title={t.results.paceTarget}
                            aria-hidden
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-5 flex items-center gap-2 text-xs text-muted">
                  <span className="h-3 w-0.5 rounded bg-fg/60" aria-hidden /> {t.results.paceTarget}
                </p>
              </Card>
            )}

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-6 py-5">
                <h2 className="text-lg font-bold">{t.results.history}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.confirm(t.results.confirmClear) && attemptsRepository.clear()}
                >
                  <Icon name="trash" className="size-4" /> {t.results.clear}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead className="border-y border-border bg-surface-2/60 text-left text-xs text-muted uppercase">
                    <tr>
                      <th className="px-6 py-3 font-semibold">{t.results.date}</th>
                      <th className="px-6 py-3 font-semibold">{t.results.test}</th>
                      <th className="px-6 py-3 font-semibold">{t.results.score}</th>
                      <th className="px-6 py-3 font-semibold">{t.results.estimate}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attempts.map((a) => {
                      const test = getPracticeTest(a.testId);
                      if (!test) return null;
                      const s = summarizeAttempt(test, a);
                      const pct = Math.round(s.accuracy * 100);
                      return (
                        <tr key={a.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-muted">{dateFormat.format(new Date(a.finishedAt))}</td>
                          <td className="px-6 py-4">
                            <Link href={href(test.simulation ? routes.simulator : routes.test(test.id))} className="font-medium hover:text-accent">
                              {test.title[locale]}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap tabular-nums">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-xs font-semibold",
                                pct >= 80 ? "bg-success-soft text-success" : pct >= 50 ? "bg-gold-soft text-gold" : "bg-danger-soft text-danger",
                              )}
                            >
                              {s.correct}/{s.total} · {pct}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-muted tabular-nums">
                            {Object.entries(s.sectionScores)
                              .map(([sec, score]) => `${sec === "rw" ? "R&W" : "Math"} ${score}`)
                              .join(" · ")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </Container>
    </main>
  );
}
