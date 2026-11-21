"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { englishOptions, gradeOptions, studentRepository, useStudentProfile, type StudentProfile } from "@/entities/student";
import { generateStudyPlan, progressRepository } from "@/entities/study-plan";
import { routes } from "@/shared/config";
import { formatDay, useI18n, weekdayNames } from "@/shared/i18n";
import { addDays, cn, daysBetween, parseISODate, toISODate } from "@/shared/lib";
import { useToday } from "@/shared/lib/react";
import { launchConfetti } from "@/shared/ui/confetti";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Logo } from "@/shared/ui/logo";

import {
  ALL_DOMAINS,
  createOnboardingDraft,
  currentScore,
  onboardingSteps,
  onboardingToProfile,
  validateOnboarding,
  type OnboardingDraft,
  type OnboardingError,
} from "../model/onboarding";
import { accountStore, activePlanStore, answersStore } from "../model/store";
import { journeyTexts } from "../model/texts";

const stepIcons: IconName[] = ["user", "trending", "target", "calendar", "brain"];
const stepBands = [
  "from-[#4a63ec] to-[#1f3bb3]",
  "from-[#1f3bb3] to-[#070b18]",
  "from-[#9a7cf7] to-[#4a63ec]",
  "from-[#2fc2b0] to-[#1f3bb3]",
  "from-[#f5b83d] to-[#9a7cf7]",
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl border-2 px-3.5 py-2 text-sm font-semibold transition active:scale-95",
        active ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-fg/80 hover:border-fg/30",
      )}
    >
      {children}
    </button>
  );
}

function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2">
      <p className="text-sm font-semibold">{children}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const inputCls =
  "h-12 w-full rounded-2xl border border-border bg-bg px-4 outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15";

/**
 * Ro'yxatdan o'tgandan keyin: o'quvchi haqida 5 qadamli so'rovnoma (testsiz) → reja xulosasi → saytga.
 * `toolbar` — til/mavzu tugmalari (app qatlamidan).
 */
export function StudentOnboarding({ toolbar }: { toolbar?: ReactNode }) {
  const profile = useStudentProfile();
  const today = useToday();
  if (profile === undefined || today === undefined) return <div className="fixed inset-0 z-[55] bg-bg" aria-busy />;
  return <Flow toolbar={toolbar} today={today} prev={profile} />;
}

function Flow({ toolbar, today, prev }: { toolbar?: ReactNode; today: string; prev: StudentProfile | null }) {
  const { t, locale, href } = useI18n();
  const o = journeyTexts[locale].onboarding;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [draft, setDraft] = useState<OnboardingDraft>(() => createOnboardingDraft(today, prev));
  const [error, setError] = useState<OnboardingError | null>(null);
  const [result, setResult] = useState<StudentProfile | null>(null);
  const days = weekdayNames(locale);
  const last = onboardingSteps.length - 1;

  const set = <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  };

  const daysLeft = draft.testDate ? daysBetween(parseISODate(today), parseISODate(draft.testDate)) : null;
  const weekly = +(draft.hours * draft.studyDays.length).toFixed(1);
  const totalHours = daysLeft !== null && daysLeft > 0 ? Math.round((weekly * daysLeft) / 7) : null;
  const plan = useMemo(() => (result ? generateStudyPlan(result, locale) : null), [result, locale]);

  function next() {
    const problem = validateOnboarding(step, draft, today);
    if (problem) return setError(problem);
    if (step < last) {
      setDir(1);
      setStep(step + 1);
      return;
    }
    const account = accountStore.get() ?? { name: prev?.fullName ?? "", email: prev?.email ?? "" };
    setResult(onboardingToProfile(draft, account, today, prev));
    launchConfetti({ particles: 120 });
  }

  function back() {
    setError(null);
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  function finish() {
    if (!result) return;
    studentRepository.save(result);
    progressRepository.reset();
    // Eski so'rovnoma rejasi endi kerak emas — dashboard yangi profil asosida tuziladi
    activePlanStore.clear();
    answersStore.clear();
    router.replace(href(routes.dashboard));
  }

  const name = (accountStore.get()?.name ?? prev?.fullName ?? "").split(/\s+/)[0];

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto bg-bg text-fg">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden>
        <span className="absolute -top-40 -left-32 size-[30rem] rounded-full bg-[#4a63ec]/15 blur-3xl" />
        <span className="absolute -right-32 -bottom-40 size-[28rem] rounded-full bg-[#2fc2b0]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-6 sm:px-5 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-2">{toolbar}</div>
        </div>

        {result && plan ? (
          /* ---------- Natija ---------- */
          <div className="animate-fade-up mt-8 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-lift">
            <div className="relative grid h-40 place-items-center overflow-hidden bg-gradient-to-br from-[#4a63ec] to-[#070b18]">
              <span className="absolute size-56 rounded-full border border-white/10" />
              <span className="absolute size-80 rounded-full border border-white/5" />
              <span className="relative grid size-16 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20 backdrop-blur">
                <Icon name="sparkles" className="size-8" />
              </span>
            </div>
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{o.ready(name)}</h1>
              <p className="mt-2 text-muted">{o.readyText(daysLeft, plan.weeklyHours, plan.totalHours)}</p>

              <p className="mt-7 text-xs font-semibold tracking-wider text-muted uppercase">{o.phases}</p>
              <ol className="mt-3 space-y-2">
                {plan.phases.map((ph, i) => {
                  const start = addDays(parseISODate(plan.startDate), ph.fromWeek * 7);
                  const end = addDays(parseISODate(plan.startDate), ph.toWeek * 7 + 6);
                  return (
                    <li
                      key={ph.id}
                      className="reg-step flex items-center gap-4 rounded-2xl border border-border bg-bg p-4"
                      style={{ animationDelay: `${150 + i * 110}ms` }}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft font-bold text-accent">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{ph.name}</p>
                        <p className="text-xs text-muted">{ph.description}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted tabular-nums">
                        {formatDay(toISODate(start), locale)} – {formatDay(toISODate(end), locale)}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {plan.feasibility !== "realistic" && (
                <p className="mt-5 rounded-2xl bg-warning-soft px-4 py-3 text-sm text-warning">
                  {t.onboarding.s5.ambitious(plan.expectedGain)}
                  {plan.extraSessionsPerWeek > 0 && ` ${t.onboarding.s5.extra(plan.extraSessionsPerWeek)}`}
                </p>
              )}

              <button
                type="button"
                onClick={finish}
                className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4a63ec] to-[#1f3bb3] font-semibold text-white shadow-[0_14px_30px_-12px_#4a63ec] transition hover:brightness-110"
              >
                {o.home} <Icon name="arrowRight" className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ---------- Progress ---------- */}
            <div className="mt-8 flex items-center justify-between text-sm">
              <span className="font-semibold">{o.stepOf(step + 1, onboardingSteps.length)}</span>
              <span className="text-muted">{o.titles[step]}</span>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={5} aria-valuenow={step + 1}>
              {onboardingSteps.map((id, i) => (
                <span key={id} className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-[#4a63ec] to-[#9a7cf7] transition-[width] duration-500"
                    style={{ width: i <= step ? "100%" : "0%" }}
                  />
                </span>
              ))}
            </div>

            {/* ---------- Kartochka ---------- */}
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
              className="mt-6 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-lift"
            >
              <div className={cn("relative grid h-36 place-items-center overflow-hidden bg-gradient-to-br transition-colors", stepBands[step])}>
                <span className="absolute -top-10 -left-10 size-40 rounded-full bg-white/10" aria-hidden />
                <span className="absolute -right-8 -bottom-16 size-48 rounded-full border border-white/15" aria-hidden />
                <span key={step} className="animate-float relative grid size-16 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur">
                  <Icon name={stepIcons[step]} className="size-8" />
                </span>
              </div>

              <div key={step} className={cn("space-y-6 p-6 sm:p-8", dir === 1 ? "ob-next" : "ob-prev")}>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-accent uppercase">{o.stepN(step + 1)}</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{o.titles[step]}</h1>
                </div>

                {step === 0 && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <Label>{o.phone}</Label>
                        <input type="tel" inputMode="tel" autoComplete="tel" placeholder="+998 90 123 45 67" className={inputCls} value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
                      </label>
                      <label className="block">
                        <Label>{o.city}</Label>
                        <input autoComplete="address-level2" placeholder={o.cityPh} className={inputCls} value={draft.city} onChange={(e) => set("city", e.target.value)} />
                      </label>
                    </div>
                    <div>
                      <Label>{o.grade}</Label>
                      <div className="flex flex-wrap gap-2">
                        {gradeOptions.map((g) => (
                          <Chip key={g.value} active={draft.grade === g.value} onClick={() => set("grade", g.value)}>
                            {t.onboarding.grades[g.value]}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label hint={o.englishHint}>{o.english}</Label>
                      <div className="flex flex-wrap gap-2">
                        {englishOptions.map((e) => (
                          <Chip key={e.value} active={draft.englishLevel === e.value} onClick={() => set("englishLevel", e.value)}>
                            {e.label}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div>
                      <Label>{o.taken}</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {([true, false] as const).map((v) => (
                          <button
                            key={String(v)}
                            type="button"
                            aria-pressed={draft.taken === v}
                            onClick={() => set("taken", v)}
                            className={cn(
                              "flex h-16 items-center justify-center gap-2 rounded-2xl border-2 text-base font-bold transition active:scale-[0.98]",
                              draft.taken === v ? "border-accent bg-accent-soft text-accent" : "border-border hover:border-fg/30",
                            )}
                          >
                            <Icon name={v ? "check" : "x"} className="size-5" /> {v ? o.yes : o.no}
                          </button>
                        ))}
                      </div>
                    </div>
                    {draft.taken ? (
                      <div className="ob-next grid gap-4 rounded-2xl bg-surface-2/60 p-4 sm:grid-cols-2">
                        {(["rw", "math"] as const).map((k) => (
                          <label key={k} className="block">
                            <Label hint={o.scoreHint}>{k === "rw" ? "Reading & Writing" : "Math"}</Label>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={200}
                              max={800}
                              step={10}
                              placeholder="550"
                              className={inputCls}
                              value={draft[k] ?? ""}
                              onChange={(e) => set(k, e.target.value === "" ? null : Number(e.target.value))}
                            />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="flex gap-3 rounded-2xl bg-accent-soft/60 p-4 text-sm text-muted">
                        <Icon name="sparkles" className="mt-0.5 size-4 shrink-0 text-accent" /> {o.noScoreHint}
                      </p>
                    )}
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="rounded-3xl border border-border bg-bg p-5">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold">{o.target}</p>
                          <p className="mt-1 font-display text-5xl leading-none font-extrabold text-accent tabular-nums">{draft.target}</p>
                        </div>
                        <p className="text-right text-sm text-muted">{o.targetFrom(currentScore(draft), draft.target)}</p>
                      </div>
                      <input
                        type="range"
                        min={800}
                        max={1600}
                        step={10}
                        value={draft.target}
                        onChange={(e) => set("target", Number(e.target.value))}
                        aria-label={o.target}
                        className="mt-5 w-full accent-[var(--accent)]"
                      />
                      <div className="mt-1 flex justify-between text-xs text-muted tabular-nums">
                        <span>800</span>
                        <span>1600</span>
                      </div>
                    </div>
                    <label className="block">
                      <Label>{o.universities}</Label>
                      <input className={inputCls} placeholder={o.universitiesPh} value={draft.universities} onChange={(e) => set("universities", e.target.value)} />
                    </label>
                    <label className="block">
                      <Label>{o.reason}</Label>
                      <input className={inputCls} placeholder={o.reasonPh} value={draft.reason} onChange={(e) => set("reason", e.target.value)} />
                    </label>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div>
                      <Label>{o.testDate}</Label>
                      <div className="flex flex-wrap gap-2">
                        {[1, 3, 6].map((m) => {
                          const iso = toISODate(addDays(parseISODate(today), m * 30));
                          return (
                            <Chip key={m} active={draft.testDate === iso} onClick={() => set("testDate", iso)}>
                              {o.months(m)}
                            </Chip>
                          );
                        })}
                        <Chip active={draft.testDate === null} onClick={() => set("testDate", null)}>
                          {o.unknownDate}
                        </Chip>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-sm text-muted">
                        {o.otherDate}
                        <input
                          type="date"
                          min={toISODate(addDays(parseISODate(today), 1))}
                          value={draft.testDate ?? ""}
                          onChange={(e) => set("testDate", e.target.value || null)}
                          className="h-10 rounded-xl border border-border bg-bg px-3 text-fg outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between">
                        <Label>{o.hours}</Label>
                        <span className="font-display text-xl font-bold text-accent">{o.hoursN(draft.hours)}</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={4}
                        step={0.5}
                        value={draft.hours}
                        onChange={(e) => set("hours", Number(e.target.value))}
                        aria-label={o.hours}
                        className="w-full accent-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <Label>{o.days}</Label>
                      <div className="grid grid-cols-7 gap-1.5">
                        {days.map((day, i) => {
                          const on = draft.studyDays.includes(i);
                          return (
                            <button
                              key={day}
                              type="button"
                              aria-pressed={on}
                              onClick={() => set("studyDays", on ? draft.studyDays.filter((d) => d !== i) : [...draft.studyDays, i])}
                              className={cn(
                                "h-12 rounded-xl border-2 text-sm font-semibold transition active:scale-95",
                                on ? "border-accent bg-accent text-accent-fg" : "border-border hover:border-fg/30",
                              )}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        [o.daysLeft, daysLeft !== null && daysLeft > 0 ? String(daysLeft) : "—"],
                        [o.perWeek, o.hoursUnit(weekly)],
                        [o.total, totalHours !== null ? `~${o.hoursUnit(totalHours)}` : "—"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-surface-2/70 p-3">
                          <p className="font-display text-xl font-bold tabular-nums">{value}</p>
                          <p className="text-xs text-muted">{label}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <p className="text-sm text-muted">{o.weakHint}</p>
                    {[
                      ["Reading & Writing", ALL_DOMAINS.slice(0, 4)],
                      ["Math", ALL_DOMAINS.slice(4)],
                    ].map(([title, list]) => (
                      <div key={title as string}>
                        <Label>{title as string}</Label>
                        <div className="flex flex-wrap gap-2">
                          {(list as typeof ALL_DOMAINS).map((id) => {
                            const on = draft.weak.includes(id);
                            return (
                              <Chip key={id} active={on} onClick={() => set("weak", on ? draft.weak.filter((d) => d !== id) : [...draft.weak, id])}>
                                {t.domains[id]}
                              </Chip>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {error && (
                  <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
                    {o.errors[error]}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4 sm:px-8">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:text-fg disabled:invisible"
                >
                  <Icon name="arrowLeft" className="size-4" /> {o.back}
                </button>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#4a63ec] to-[#1f3bb3] px-6 font-semibold text-white shadow-[0_14px_30px_-12px_#4a63ec] transition hover:brightness-110"
                >
                  {step === last ? o.finish : o.next} <Icon name={step === last ? "sparkles" : "arrowRight"} className="size-4" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
