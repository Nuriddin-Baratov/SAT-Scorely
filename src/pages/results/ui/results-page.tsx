"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";

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
import { localeTags, useI18n } from "@/shared/i18n";
import { cn, formatDuration } from "@/shared/lib";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Particles } from "@/shared/ui/premium";
import { Card, Container, IconTile } from "@/shared/ui/primitives";

import { CountUp, Meter, toneOf, useInView } from "./meter";
import { ProgressChart } from "./progress-chart";

/** Haqiqiy SAT'da bitta savolga ajratilgan o'rtacha vaqt (soniya) */
const TARGET_PACE: Record<SectionId, number> = { rw: 71, math: 95 };

function analyze(attempts: TestAttempt[]) {
  const perf = domainPerformance(attempts);
  const byDomain = (Object.entries(perf) as [DomainId, DomainStat][])
    .map(([id, stat]) => ({ id, section: getDomain(id).sectionId, ...stat }))
    .sort((a, b) => a.correct / a.total - b.correct / b.total);
  const correct = byDomain.reduce((sum, d) => sum + d.correct, 0);
  const total = byDomain.reduce((sum, d) => sum + d.total, 0);
  const seconds = attempts.reduce((sum, a) => sum + a.durationSec, 0);
  const pace = byDomain
    .filter((d) => d.timed > 0)
    .map((d) => ({ id: d.id, avg: Math.round(d.seconds / d.timed), target: TARGET_PACE[d.section] }))
    .sort((a, b) => b.avg / b.target - a.avg / a.target);

  // Har bir urinish xulosasi (eng yangisi birinchi)
  const runs = attempts.flatMap((a) => {
    const test = getPracticeTest(a.testId);
    return test ? [{ attempt: a, test, summary: summarizeAttempt(test, a) }] : [];
  });
  const latest = runs[0];
  const delta = runs.length > 1 ? Math.round((runs[0].summary.accuracy - runs[1].summary.accuracy) * 100) : null;
  const best = runs.reduce((m, r) => Math.max(m, r.summary.accuracy), 0);

  return { correct, total, seconds, byDomain, pace, runs, latest, delta, best, weakest: byDomain.find((d) => d.correct / d.total < 0.8) };
}

const pillClass = {
  good: "bg-success-soft text-success",
  mid: "bg-gold-soft text-gold",
  low: "bg-danger-soft text-danger",
} as const;

/** Halqa ko'rinishidagi aniqlik ko'rsatkichi */
function Ring({ value, label }: { value: number; label: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-36 shrink-0 sm:size-40">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffe3a3" />
            <stop offset=".5" stopColor="#f5c76b" />
            <stop offset="1" stopColor="#5b8cff" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          // Halqa 0 dan chizilib to'ladi
          className="ring-draw drop-shadow-[0_0_8px_rgb(245_199_107/0.45)]"
          style={{ "--c": c } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-4xl font-extrabold">
            <CountUp value={value} run delay={200} suffix="%" />
          </p>
          <p className="mt-0.5 text-[11px] text-white/55">{label}</p>
        </div>
      </div>
    </div>
  );
}

type Stats = ReturnType<typeof analyze>;
const toneText = { good: "text-success", mid: "text-gold", low: "text-danger" } as const;

/** Mavzular bo'yicha aniqlik: bo'limlarga ajratilgan, ko'ringanda ketma-ket o'sadigan chiziqlar. */
function DomainCard({ domains }: { domains: Stats["byDomain"] }) {
  const { t } = useI18n();
  const { ref, inView } = useInView<HTMLDivElement>();
  let order = 0;
  return (
    <Card className="p-6 sm:p-7">
      <div ref={ref}>
        <h2 className="text-lg font-bold">{t.results.byDomain}</h2>
        {(["rw", "math"] as const).map((sec) => {
          const list = domains.filter((d) => d.section === sec);
          if (!list.length) return null;
          const avg = Math.round((list.reduce((s, d) => s + d.correct, 0) / list.reduce((s, d) => s + d.total, 0)) * 100);
          return (
            <div key={sec} className="mt-7">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase",
                    sec === "rw" ? "bg-accent-soft text-accent" : "bg-gold-soft text-gold",
                  )}
                >
                  {t.sections[sec]}
                </span>
                <span className="h-px flex-1 bg-border" />
                <span className={cn("text-sm font-bold", toneText[toneOf(avg)])}>
                  <CountUp value={avg} run={inView} suffix="%" />
                </span>
              </div>
              <ul className="mt-4 space-y-1">
                {list.map((d) => {
                  const pct = Math.round((d.correct / d.total) * 100);
                  const delay = order++ * 90;
                  return (
                    <li key={d.id} className="rounded-2xl px-3 py-2.5 transition hover:bg-surface-2/60">
                      <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
                        <span className="font-medium">{t.domains[d.id]}</span>
                        <span className="shrink-0 text-muted tabular-nums">
                          {d.correct}/{d.total} ·{" "}
                          <strong className={cn("text-base", toneText[toneOf(pct)])}>
                            <CountUp value={pct} run={inView} delay={delay} suffix="%" />
                          </strong>
                        </span>
                      </div>
                      <Meter value={pct} tone={toneOf(pct)} run={inView} delay={delay} />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** Tezlik: bitta savolga o'rtacha vaqt, oltin belgi — haqiqiy SAT'dagi o'rtacha. */
function PaceCard({ pace }: { pace: Stats["pace"] }) {
  const { t } = useI18n();
  const r = t.results;
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <Card className="p-6">
      <div ref={ref}>
        <div className="flex items-start gap-3">
          <IconTile tone="gold">
            <Icon name="clock" />
          </IconTile>
          <div>
            <h2 className="font-bold">{r.paceTitle}</h2>
            <p className="mt-0.5 text-xs text-muted">{r.paceHint}</p>
          </div>
        </div>
        <ul className="mt-5 space-y-1">
          {pace.map((p, i) => {
            const slow = p.avg > p.target;
            const scale = Math.max(p.avg, p.target) * 1.25;
            const delay = i * 90;
            return (
              <li key={p.id} className="rounded-2xl px-3 py-2.5 transition hover:bg-surface-2/60">
                <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-medium">{t.domains[p.id]}</span>
                  <span className={cn("shrink-0 font-semibold", slow ? "text-warning" : "text-success")}>
                    <CountUp value={p.avg} run={inView} delay={delay} suffix=" s" />
                    <span className="font-normal text-muted tabular-nums"> / {p.target} s</span>
                  </span>
                </div>
                <Meter
                  value={(p.avg / scale) * 100}
                  tone={slow ? "mid" : "good"}
                  run={inView}
                  delay={delay}
                  marker={(p.target / scale) * 100}
                  markerLabel={r.paceTarget}
                />
              </li>
            );
          })}
        </ul>
        <p className="mt-4 flex items-center gap-2 px-3 text-xs text-muted">
          <span className="size-2 rounded-full bg-[#f5c76b] shadow-[0_0_8px_#f5c76b]" aria-hidden /> {r.paceTarget}
        </p>
      </div>
    </Card>
  );
}

/** Kichik halqa: test aniqligi, 0 dan chizilib to'ladi */
function MiniRing({ pct, run, delay }: { pct: number; run: boolean; delay: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const tone = toneOf(pct);
  const color = { good: "#34d399", mid: "#f5c76b", low: "#fb7185" }[tone];
  return (
    <div className="relative size-14 shrink-0 rounded-full bg-surface">
      <svg viewBox="0 0 48 48" className="size-full -rotate-90" aria-hidden>
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="4.5" />
        {run && (
          <circle
            cx="24"
            cy="24"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - Math.max(pct, 2) / 100)}
            className="ring-draw"
            style={{ "--c": c, animationDelay: `${delay}ms`, filter: `drop-shadow(0 0 4px ${color})` } as CSSProperties}
          />
        )}
      </svg>
      <span className={cn("absolute inset-0 grid place-items-center text-xs font-bold", toneText[tone])}>
        <CountUp value={pct} run={run} delay={delay} />
      </span>
    </div>
  );
}

/** Testlar tarixi: vaqt chizig'i, halqalar, yorliqlar va ketma-ket chiqish animatsiyasi */
function HistoryCard({ runs, best, format }: { runs: Stats["runs"]; best: number; format: (d: Date) => string }) {
  const { t, locale, href } = useI18n();
  const r = t.results;
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <h2 className="flex items-center gap-2.5 text-lg font-bold">
          {r.history}
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent tabular-nums">{runs.length}</span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted hover:bg-danger-soft hover:text-danger"
          onClick={() => window.confirm(r.confirmClear) && attemptsRepository.clear()}
        >
          <Icon name="trash" className="size-4" /> {r.clear}
        </Button>
      </div>

      <div ref={ref} className={cn("relative border-t border-border px-3 py-3 sm:px-4", inView && "history-run")}>
        {/* Vaqt chizig'i */}
        <span className="absolute top-10 bottom-10 left-[2.4rem] w-px bg-gradient-to-b from-accent/40 via-border to-transparent sm:left-[2.65rem]" aria-hidden />
        <ul className="relative space-y-1">
          {runs.map(({ attempt, test, summary }, i) => {
            const pct = Math.round(summary.accuracy * 100);
            const tone = toneOf(pct);
            const delay = i * 110;
            const sections = Object.entries(summary.sectionScores) as [SectionId, number][];
            const isTop = summary.accuracy === best && runs.length > 1;
            return (
              <li key={attempt.id} className="history-row" style={{ "--i": `${delay}ms` } as CSSProperties}>
                <Link
                  href={href(test.simulation ? routes.simulator : routes.test(test.id))}
                  className="group grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 rounded-2xl p-3 transition hover:bg-surface-2/60 sm:grid-cols-[auto_1fr_auto_auto] sm:gap-x-6"
                >
                  <MiniRing pct={pct} run={inView} delay={delay} />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold transition group-hover:text-accent">{test.title[locale]}</p>
                      {i === 0 && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold tracking-wide text-accent-fg uppercase">
                          {r.newest}
                        </span>
                      )}
                      {isTop && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-gold uppercase">
                          <Icon name="trophy" className="size-3" /> {r.top}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <Icon name="clock" className="size-3.5" /> {format(new Date(attempt.finishedAt))}
                    </p>
                  </div>

                  <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
                    <div className="w-full sm:w-32">
                      <Meter value={pct} tone={tone} run={inView} delay={delay} />
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums", pillClass[tone])}>
                      {summary.correct}/{summary.total}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:justify-end">
                    {sections.map(([sec, score]) => (
                      <span
                        key={sec}
                        className={cn(
                          "rounded-xl px-2.5 py-1.5 text-xs font-semibold tabular-nums",
                          sec === "rw" ? "bg-accent-soft text-accent" : "bg-gold-soft text-gold",
                        )}
                      >
                        {sec === "rw" ? "R&W" : "Math"} <span className="text-sm font-bold">{score}</span>
                      </span>
                    ))}
                    <Icon
                      name="arrowRight"
                      className="ml-1 hidden size-4 text-muted opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 sm:block"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

export function ResultsPage() {
  const { t, locale, href } = useI18n();
  const r = t.results;
  const attempts = useTestAttempts();
  const stats = useMemo(() => analyze(attempts ?? []), [attempts]);
  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(localeTags[locale], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    [locale],
  );
  const shortDate = useMemo(() => new Intl.DateTimeFormat(localeTags[locale], { day: "numeric", month: "short" }), [locale]);

  const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
  const kpis: { icon: IconName; label: string; value: string }[] = [
    { icon: "pencil", label: r.totalTests, value: String(attempts?.length ?? 0) },
    { icon: "list", label: r.totalQuestions, value: String(stats.total) },
    { icon: "clock", label: r.totalTime, value: formatDuration(stats.seconds) },
    { icon: "trophy", label: r.best, value: `${Math.round(stats.best * 100)}%` },
  ];
  const scores = stats.latest?.summary.sectionScores ?? {};
  const latestTotal = scores.rw && scores.math ? scores.rw + scores.math : null;

  if (attempts === undefined) {
    return (
      <main className="flex-1">
        <Container className="py-12 sm:py-16">
          <div className="h-72 animate-pulse rounded-[2rem] bg-surface-2" />
        </Container>
      </main>
    );
  }

  return (
    <main className="relative flex-1">
      <Container className="relative space-y-6 py-8 sm:py-12">
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden rounded-[2rem] bg-[#0b0f1a] p-6 text-white shadow-lift sm:p-10">
          <Particles />
          <div className="relative">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#f5c76b] uppercase">{r.eyebrow}</p>
            <h1 className="mt-3 font-display text-3xl font-bold sm:text-5xl">{r.title}</h1>
            <p className="mt-2 max-w-xl text-white/60">{r.description}</p>

            {attempts.length === 0 ? (
              <div className="mt-8 flex flex-col items-start gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">{r.emptyTitle}</h2>
                  <p className="mt-1 max-w-md text-sm text-white/60">{r.emptyText}</p>
                </div>
                <Link href={href(routes.tests)} className="pro-btn">
                  {r.emptyCta} <Icon name="arrowRight" className="size-4" />
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-8 flex flex-col items-center gap-8 sm:flex-row sm:items-center">
                  <Ring value={accuracy} label={r.avgAccuracy} />
                  <div className="w-full text-center sm:text-left">
                    <p className="text-sm text-white/55">{r.latest}</p>
                    <p className="mt-1 font-display text-6xl leading-none font-extrabold tabular-nums sm:text-7xl">
                      <span className="pro-gradient-text">
                        {latestTotal ?? (Object.values(scores).join(" / ") || "—")}
                      </span>
                      {latestTotal && <span className="ml-2 text-2xl font-bold text-white/30">/ 1600</span>}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                      {(Object.entries(scores) as [SectionId, number][]).map(([sec, score]) => (
                        <span key={sec} className="rounded-full bg-white/[0.07] px-3 py-1 text-sm ring-1 ring-white/10">
                          {sec === "rw" ? "R&W" : "Math"} <strong className="tabular-nums">{score}</strong>
                        </span>
                      ))}
                      {stats.delta !== null && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold",
                            stats.delta >= 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300",
                          )}
                        >
                          <Icon name="arrowRight" className={cn("size-3.5", stats.delta >= 0 ? "-rotate-45" : "rotate-45")} />
                          {r.vsPrev(stats.delta)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {kpis.map((k) => (
                    <div key={k.label} className="pro-card flex items-center gap-3 p-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5c76b]/10 text-[#f5c76b]">
                        <Icon name={k.icon} className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-xl font-bold tabular-nums">{k.value}</p>
                        <p className="truncate text-xs text-white/50">{k.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {attempts.length > 0 && (
          <>
            {/* ---------- Grafik ---------- */}
            {stats.runs.length > 1 && (
              <Card className="p-6 sm:p-7">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold">{r.chartTitle}</h2>
                  <p className="text-sm text-muted">{r.chartHint}</p>
                </div>
                <div className="mt-5">
                  <ProgressChart
                    valueLabel={r.chartTitle}
                    avgLabel={r.avgAccuracy}
                    points={[...stats.runs]
                      .reverse()
                      .slice(-20)
                      .map(({ attempt, test, summary }) => ({
                        label: test.title[locale],
                        date: shortDate.format(new Date(attempt.finishedAt)),
                        value: Math.round(summary.accuracy * 100),
                      }))}
                  />
                </div>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
              {/* ---------- Mavzular ---------- */}
              <DomainCard domains={stats.byDomain} />

              <div className="space-y-6">
                {stats.weakest && (
                  <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#f5c76b]/25 via-rose-400/10 to-transparent p-[1px]">
                    <div className="rounded-[1.7rem] bg-surface p-6">
                      <p className="flex items-center gap-2 text-sm font-semibold text-warning">
                        <Icon name="flame" className="size-4" /> {r.weakest}
                      </p>
                      <p className="mt-2 leading-relaxed">
                        {r.weakText(t.domains[stats.weakest.id], Math.round((stats.weakest.correct / stats.weakest.total) * 100))}
                      </p>
                      <ButtonLink href={href(routes.practice)} size="sm" className="mt-4">
                        {t.nav.practice} <Icon name="arrowRight" className="size-4" />
                      </ButtonLink>
                    </div>
                  </div>
                )}
                <Card className="flex items-center gap-4 p-6">
                  <IconTile tone="accent">
                    <Icon name="pencil" />
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted">{t.home.tools.items.tests.text}</p>
                  </div>
                  <ButtonLink href={href(routes.tests)} size="sm" variant="outline">
                    {t.nav.tests}
                  </ButtonLink>
                </Card>

                {/* ---------- Tezlik ---------- */}
                {stats.pace.length > 0 && <PaceCard pace={stats.pace} />}
              </div>
            </div>

            {/* ---------- Tarix ---------- */}
            <HistoryCard runs={stats.runs} best={stats.best} format={(d) => dateFormat.format(d)} />
          </>
        )}
      </Container>
    </main>
  );
}
