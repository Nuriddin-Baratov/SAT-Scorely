"use client";

import { useMemo, useState } from "react";

import { firstName, useStudentProfile, type StudentProfile } from "@/entities/student";
import {
  computeProgress,
  currentWeekIndex,
  findNextSession,
  difficultyLabels,
  phaseMetaFor,
  sessionKindLabels,
  SessionKindIcon,
  useCompletedSessions,
  type PlanSession,
  type StudyPlan,
} from "@/entities/study-plan";
import { ResetProfileButton } from "@/features/reset-profile";
import { CompleteCheckbox } from "@/features/track-progress";
import { routes } from "@/shared/config";
import { formatDay, useI18n, weekdayNames } from "@/shared/i18n";
import { cn, daysBetween, parseISODate, weekdayIndex } from "@/shared/lib";
import { useToday } from "@/shared/lib/react";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Badge, Card, Eyebrow, IconTile, ProgressBar } from "@/shared/ui/primitives";

import { useStudyPlan } from "../model/use-study-plan";
import { SessionDetail } from "./session-detail";

export function StudyDashboard() {
  const profile = useStudentProfile();
  const completed = useCompletedSessions();
  const today = useToday();

  if (profile === undefined || completed === undefined || today === undefined) return <DashboardSkeleton />;
  if (profile === null) return <EmptyState />;
  return <Dashboard profile={profile} completed={completed} today={today} />;
}

const feasibilityClass = {
  realistic: "bg-emerald-400/15 text-emerald-300",
  ambitious: "bg-amber-400/15 text-amber-300",
  stretch: "bg-rose-400/15 text-rose-300",
} as const;

function Dashboard({ profile, completed, today }: { profile: StudentProfile; completed: string[]; today: string }) {
  const { t, locale, href } = useI18n();
  const d = t.dashboard;
  const phaseMeta = phaseMetaFor(locale);
  const kindLabel = sessionKindLabels(locale);
  const days = weekdayNames(locale);
  const { plan, adaptedFrom } = useStudyPlan(profile);
  const performance = { questions: adaptedFrom };
  const progress = computeProgress(plan, completed);
  const next = findNextSession(plan, completed, today);
  const thisWeek = currentWeekIndex(plan, today);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [openSession, setOpenSession] = useState<PlanSession | null>(null);
  const done = useMemo(() => new Set(completed), [completed]);

  const week = plan.weeks[selectedWeek ?? thisWeek];
  const daysLeft = plan.testDate ? daysBetween(parseISODate(today), parseISODate(plan.testDate)) : null;
  const feas = { ...d.feasibility[plan.feasibility], cls: feasibilityClass[plan.feasibility] };

  const stats: { icon: IconName; tone: "accent" | "gold" | "success" | "warning"; label: string; value: string; hint: string }[] = [
    { icon: "check", tone: "success", label: d.stats.sessions, value: `${progress.done}/${progress.total}`, hint: d.stats.done },
    { icon: "clock", tone: "accent", label: d.stats.studied, value: d.hours(progress.hoursDone), hint: d.stats.ofTotal(plan.totalHours) },
    { icon: "monitor", tone: "gold", label: d.stats.practiceTests, value: String(plan.practiceTests), hint: d.stats.fullTest },
    {
      icon: "calendar",
      tone: "warning",
      label: daysLeft !== null ? d.stats.untilTest : d.stats.duration,
      value: daysLeft !== null ? d.days(Math.max(0, daysLeft)) : d.weeks(plan.weeks.length),
      hint: plan.testDate ? formatDay(plan.testDate, locale, true) : d.stats.noDate,
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* ============ HERO ============ */}
      <section className="noise relative overflow-hidden rounded-2xl bg-ink text-white sm:rounded-[2rem]">
        <div className="aurora opacity-80" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="bg-grid-dark pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative grid gap-8 p-4 sm:gap-10 sm:p-10 lg:grid-cols-[1.25fr_1fr] lg:items-center [&>*]:min-w-0">
          <div>
            <Eyebrow className="text-[#bfdbfe]">{d.eyebrow}</Eyebrow>
            <h1 className="mt-2 text-2xl leading-none sm:mt-4 sm:text-6xl">
              {d.hello} <span className="text-gradient-light font-serif font-normal tracking-normal italic">{firstName(profile)}</span>
            </h1>
            <div className="mt-5 hidden flex-wrap gap-2 text-xs sm:flex">
              <span className="glass rounded-full px-3 py-1.5">{d.weekPlan(plan.weeks.length)}</span>
              <span className="glass rounded-full px-3 py-1.5">{d.phase(phaseMeta[plan.weeks[thisWeek].phase].name)}</span>
              <span className="glass rounded-full px-3 py-1.5">{d.weekN(thisWeek + 1)}</span>
            </div>

            <div className="mt-4 flex items-end gap-3 sm:mt-9 sm:gap-5">
              <div>
                <p className="text-xs text-white/50">{d.now}</p>
                <p className="font-display text-4xl leading-none sm:text-7xl">{plan.baseline.total}</p>
              </div>
              <div className="mb-4 flex min-w-6 flex-1 items-center gap-2 sm:mb-5" aria-hidden>
                <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-[#bfdbfe]" />
                <Icon name="arrowRight" className="size-4 text-[#bfdbfe]" />
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50">{d.target}</p>
                <p className="text-gradient-light font-display text-4xl leading-none sm:text-7xl">{plan.target.total}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-7 sm:gap-5">
              <SectionScore label="Reading & Writing" from={plan.baseline.rw} to={plan.target.rw} />
              <SectionScore label="Math" from={plan.baseline.math} to={plan.target.math} />
            </div>
          </div>

          <div className="glass hidden rounded-[1.75rem] p-5 sm:p-6 lg:block">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{d.progress}</p>
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", feas.cls)}>{feas.label}</span>
            </div>
            <div className="mt-5 flex items-center gap-6">
              <div className="relative shrink-0">
                <Ring value={progress.percent} />
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="font-display text-3xl">{Math.round(progress.percent)}%</p>
                    <p className="text-[11px] text-white/50">{d.stats.done}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-white/50">{d.expectedGain}</p>
                  <p className="font-display text-2xl">+{plan.expectedGain} {t.common.points}</p>
                </div>
                <div>
                  <p className="text-white/50">{d.weeklyLoad}</p>
                  <p className="font-semibold">{d.hours(plan.weeklyHours)}</p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-white/60">
              {feas.text}
              {plan.extraSessionsPerWeek > 0 && ` ${d.extra(plan.extraSessionsPerWeek)}`}
              {plan.suggestLaterDate && ` ${d.later}`}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-5">
              <ButtonLink href={href(routes.onboarding)} variant="ghost" size="sm" className="glass text-white hover:bg-white/10">
                <Icon name="pencil" className="size-4" />
                {d.edit}
              </ButtonLink>
              <ResetProfileButton className="text-white/60 hover:bg-white/10 hover:text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATISTIKA ============ */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4 p-3.5 sm:p-5">
            <IconTile tone={s.tone} className="hidden sm:grid">
              <Icon name={s.icon} />
            </IconTile>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-xs text-muted">
                <Icon name={s.icon} className="size-3.5 sm:hidden" />
                {s.label}
              </p>
              <p className="font-display text-xl sm:text-2xl">{s.value}</p>
              <p className="hidden truncate text-[11px] text-muted sm:block">{s.hint}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ============ KEYINGI MASHG'ULOT ============ */}
      {next ? (
        <NextSessionCard session={next} today={today} onDetails={() => setOpenSession(next)} />
      ) : (
        <Card className="p-6 text-center sm:p-10">
          <IconTile tone="gold" className="mx-auto size-14">
            <Icon name="trophy" className="size-6" />
          </IconTile>
          <p className="mt-4 font-display text-3xl">{d.allDoneTitle}</p>
          <p className="mt-2 text-muted">{d.allDoneText}</p>
        </Card>
      )}

      <div className="hidden gap-6 lg:grid lg:grid-cols-2">
        <DomainFocusCard plan={plan} adaptedFrom={performance.questions} />
        <PhasesCard plan={plan} currentWeek={thisWeek} />
      </div>

      {/* ============ HAFTALIK JADVAL ============ */}
      <Card className="p-4 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <IconTile className="hidden sm:grid">
              <Icon name="calendar" />
            </IconTile>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl">{d.schedule}</h2>
              <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">
                {formatDay(week.start, locale)} – {formatDay(week.end, locale)} · {phaseMeta[week.phase].name}
                {week.focus.length > 0 && ` · ${d.focus}: ${week.focus.join(", ")}`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5 sm:gap-2">
            <Button variant="outline" size="sm" className="size-9 px-0! sm:w-auto sm:px-3.5!" disabled={week.index === 0} onClick={() => setSelectedWeek(week.index - 1)} aria-label={d.prevWeek}>
              <Icon name="arrowRight" className="size-4 rotate-180" />
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" disabled={week.index === thisWeek} onClick={() => setSelectedWeek(null)}>
              {d.thisWeek}
            </Button>
            <Button variant="outline" size="sm" className="size-9 px-0! sm:w-auto sm:px-3.5!" disabled={week.index === plan.weeks.length - 1} onClick={() => setSelectedWeek(week.index + 1)} aria-label={d.nextWeek}>
              <Icon name="arrowRight" className="size-4" />
            </Button>
          </div>
        </div>

        <div className="-mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-2 [scrollbar-width:none] sm:mt-6" role="tablist" aria-label={d.weeksLabel}>
          {plan.weeks.map((w) => {
            const total = w.sessions.length;
            const doneCount = w.sessions.filter((s) => done.has(s.id)).length;
            const active = w.index === week.index;
            return (
              <button
                key={w.index}
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedWeek(w.index)}
                className={cn(
                  "relative w-16 shrink-0 overflow-hidden rounded-2xl border px-2 pt-2 pb-3 text-center transition",
                  active ? "border-accent bg-accent text-accent-fg shadow-[0_8px_20px_-8px_var(--accent)]" : "border-border bg-bg hover:border-fg/25",
                  w.index === thisWeek && !active && "border-accent/50",
                )}
              >
                <span className={cn("block text-[10px] font-medium", active ? "text-white/70" : "text-muted")}>{d.week}</span>
                <span className="block text-lg leading-tight font-bold">{w.index + 1}</span>
                <span
                  className={cn("absolute inset-x-2 bottom-1.5 h-1 rounded-full", active ? "bg-white/25" : "bg-surface-2")}
                  aria-hidden
                >
                  <span
                    className={cn("block h-full rounded-full", active ? "bg-white" : "bg-success")}
                    style={{ width: total ? `${(doneCount / total) * 100}%` : 0 }}
                  />
                </span>
              </button>
            );
          })}
        </div>

        <ul className="mt-3 space-y-1.5 sm:mt-5 sm:space-y-2">
          {week.sessions.length === 0 && <li className="py-8 text-center text-sm text-muted">{d.noSessions}</li>}
          {week.sessions.map((session) => {
            const isDone = done.has(session.id);
            const isToday = session.date === today;
            return (
              <li
                key={session.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-2.5 transition sm:gap-4 sm:rounded-2xl sm:p-4",
                  isToday ? "border-accent/40 bg-accent-soft/50" : "border-border bg-bg",
                )}
              >
                <CompleteCheckbox sessionId={session.id} done={isDone} label={session.title} />
                <div className="w-11 shrink-0 text-center">
                  <p className="text-[11px] font-medium text-muted uppercase">{days[weekdayIndex(parseISODate(session.date))]}</p>
                  <p className={cn("text-xl leading-tight font-bold", isToday && "text-accent")}>{parseISODate(session.date).getDate()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenSession(session)}
                  className="group flex min-w-0 flex-1 items-center gap-4 rounded-xl p-1 text-left"
                >
                  <SessionKindIcon kind={session.kind} className="hidden sm:grid" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate font-semibold", isDone && "text-muted line-through")}>{session.title}</p>
                    <p className="hidden truncate text-sm text-muted sm:block">{session.subtitle}</p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-2 md:flex">
                    {isToday && <Badge tone="accent">{t.dashboard.today}</Badge>}
                    <Badge>{kindLabel[session.kind]}</Badge>
                    <Badge>
                      <Icon name="clock" className="size-3" /> {session.minutes} {t.common.min}
                    </Badge>
                  </div>
                  <Icon name="arrowRight" className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Dialog open={openSession !== null} onClose={() => setOpenSession(null)} title={d.sessionDetails}>
        {openSession && <SessionDetail session={openSession} done={done.has(openSession.id)} />}
      </Dialog>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const size = 128;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <defs>
        <linearGradient id="ring-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#bfdbfe" />
          <stop offset="1" stopColor="#bfdbfe" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#ring-grad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (pct / 100) * c}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}

function SectionScore({ label, from, to }: { label: string; from: number; to: number }) {
  const scale = (n: number) => ((n - 200) / 600) * 100;
  const short = label.startsWith("Reading") ? "R&W" : label;
  return (
    <div>
      <div className="flex justify-between gap-2 text-sm">
        <span className="font-medium text-white/85">
          <span className="sm:hidden">{short}</span>
          <span className="hidden sm:inline">{label}</span>
        </span>
        <span className="text-white/70 tabular-nums">
          {from} → <span className="font-semibold text-white">{to}</span>
        </span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-white/15">
        <div className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: `${scale(to)}%` }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${scale(from)}%` }} />
      </div>
    </div>
  );
}

function NextSessionCard({ session, today, onDetails }: { session: PlanSession; today: string; onDetails: () => void }) {
  const { t, locale, href } = useI18n();
  const d = t.dashboard;
  const diff = daysBetween(parseISODate(today), parseISODate(session.date));
  const when = diff === 0 ? t.dashboard.today : diff === 1 ? d.tomorrow : diff < 0 ? d.missed(-diff) : formatDay(session.date, locale);
  return (
    <div className="gradient-border relative overflow-hidden rounded-2xl bg-surface p-4 shadow-lift sm:rounded-[2rem] sm:p-9">
      <div className="glow pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-8">
        <div>
          <div className="flex items-center gap-3">
            <SessionKindIcon kind={session.kind} />
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">{d.nextSession}</p>
              <p className={cn("text-sm font-medium", diff < 0 ? "text-warning" : "text-muted")}>{when}</p>
            </div>
          </div>
          <h2 className="mt-3 text-xl leading-tight break-words sm:mt-5 sm:text-5xl">{session.title}</h2>
          <p className="mt-1 line-clamp-1 text-sm text-muted sm:mt-2 sm:line-clamp-none sm:text-base">{session.subtitle}</p>
          <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
            <Badge tone="accent" className="px-3 py-1">{sessionKindLabels(locale)[session.kind]}</Badge>
            <Badge className="px-3 py-1"><Icon name="clock" className="size-3" /> {session.minutes} {t.common.minutes}</Badge>
            <Badge className="px-3 py-1">{session.questions} {t.common.questions}</Badge>
            <Badge tone="gold" className="px-3 py-1">{difficultyLabels(locale)[session.difficulty]}</Badge>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:mt-8 sm:flex-row">
            <ButtonLink href={href(routes.session(session.id))} size="lg" className="w-full sm:w-auto">
              <Icon name="play" className="size-4" />
              {d.start}
            </ButtonLink>
            <Button variant="ghost" size="lg" onClick={onDetails} className="w-full sm:w-auto">
              {d.sessionDetails}
            </Button>
          </div>
        </div>
        <ol className="relative hidden space-y-2 before:absolute lg:block before:top-5 before:bottom-5 before:left-[1.35rem] before:w-px before:bg-border">
          {session.blocks.map((b, i) => (
            <li key={b.label} className="relative flex items-center gap-4 rounded-2xl border border-border bg-surface px-3 py-3">
              <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-white">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{b.label}</p>
                <p className="truncate text-xs text-muted">{b.detail}</p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">{b.minutes} {t.common.min}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function DomainFocusCard({ plan, adaptedFrom }: { plan: StudyPlan; adaptedFrom: number }) {
  const { t } = useI18n();
  const d = t.dashboard;
  const max = Math.max(...plan.domainFocus.map((d) => d.share));
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <IconTile>
          <Icon name="chart" />
        </IconTile>
        <div>
          <h2 className="text-xl">{d.priorities}</h2>
          <p className="mt-0.5 text-sm text-muted">{d.prioritiesHint}</p>
        </div>
      </div>
      {adaptedFrom > 0 && (
        <p className="mt-5 flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-2.5 text-sm text-success">
          <Icon name="sparkles" className="size-4 shrink-0" /> {d.adapted(adaptedFrom)}
        </p>
      )}
      <ul className="mt-7 space-y-4">
        {plan.domainFocus.map((f) => (
          <li key={f.domainId}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className={cn("size-2 shrink-0 rounded-full", f.sectionId === "rw" ? "bg-accent" : "bg-gold")} />
                <span className="truncate font-medium">{f.name}</span>
              </span>
              <span className="shrink-0 text-muted tabular-nums">
                {d.lessons(f.lessons)} · {Math.round(f.share * 100)}%
              </span>
            </div>
            <ProgressBar className="mt-2" value={(f.share / max) * 100} tone={f.sectionId === "rw" ? "accent" : "gold"} label={f.name} />
          </li>
        ))}
      </ul>
      <div className="mt-6 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent" />Reading & Writing</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-gold" />Math</span>
      </div>
    </Card>
  );
}

function PhasesCard({ plan, currentWeek }: { plan: StudyPlan; currentWeek: number }) {
  const { t, locale } = useI18n();
  const d = t.dashboard;
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <IconTile tone="gold">
          <Icon name="layers" />
        </IconTile>
        <div>
          <h2 className="text-xl">{d.phases}</h2>
          <p className="mt-0.5 text-sm text-muted">
            {formatDay(plan.startDate, locale)} – {formatDay(plan.endDate, locale, true)}
          </p>
        </div>
      </div>
      <ol className="relative mt-7 space-y-3">
        {plan.phases.map((phase) => {
          const active = currentWeek >= phase.fromWeek && currentWeek <= phase.toWeek;
          const past = currentWeek > phase.toWeek;
          return (
            <li
              key={phase.id}
              className={cn(
                "flex gap-4 rounded-2xl border p-4 transition",
                active ? "border-accent/40 bg-accent-soft/60" : "border-border bg-bg",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                  active ? "bg-accent text-white" : past ? "bg-success text-white" : "bg-surface-2 text-muted",
                )}
              >
                {past ? <Icon name="check" className="size-4" strokeWidth={3} /> : plan.phases.indexOf(phase) + 1}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{phase.name}</p>
                  <span className="text-xs text-muted">
                    {phase.fromWeek === phase.toWeek ? d.weekN(phase.fromWeek + 1) : d.weekRange(phase.fromWeek + 1, phase.toWeek + 1)}
                  </span>
                  {active && <Badge tone="accent">{d.current}</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted">{phase.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function DashboardSkeleton() {
  const { t } = useI18n();
  return (
    <div className="space-y-6" aria-busy aria-label={t.dashboard.loading}>
      <div className="h-[420px] animate-pulse rounded-[2rem] bg-ink/90" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-3xl bg-surface-2" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-[2rem] bg-surface-2" />
    </div>
  );
}

function EmptyState() {
  const { t, href } = useI18n();
  const d = t.dashboard;
  return (
    <section className="noise relative overflow-hidden rounded-[2rem] bg-ink px-6 py-24 text-center text-white">
      <div className="aurora" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="bg-grid-dark pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-lg">
        <IconTile tone="ink" className="mx-auto size-14">
          <Icon name="sparkles" className="size-6" />
        </IconTile>
        <h1 className="mt-6 text-5xl leading-tight">
          {d.emptyTitleA} <span className="text-gradient-light font-serif font-normal tracking-normal italic">{d.emptyTitleB}</span>
        </h1>
        <p className="mt-4 text-white/65">{d.emptyText}</p>
        <ButtonLink
          href={href(routes.onboarding)}
          size="lg"
          variant="secondary"
          className="mt-9 bg-white text-ink hover:opacity-100 hover:brightness-95"
        >
          {d.emptyCta} <Icon name="arrowRight" className="size-4.5" />
        </ButtonLink>
      </div>
    </section>
  );
}
