"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { domainDescription, getDomainsBySection, sections, type DomainId } from "@/entities/sat";
import {
  englishOptions,
  gradeOptions,
  levelOptions,
  scoreSourceOptions,
  sessionLengthOptions,
  studentRepository,
  useStudentProfile,
  type Rating,
  type StudentProfile,
} from "@/entities/student";
import { estimateBaseline, generateStudyPlan, progressRepository } from "@/entities/study-plan";
import { routes } from "@/shared/config";
import { formatDay, formatMinutes, useI18n, weekdayNames } from "@/shared/i18n";
import { addDays, cn, parseISODate, toISODate } from "@/shared/lib";
import { useToday } from "@/shared/lib/react";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card, ProgressBar } from "@/shared/ui/primitives";

import { createDraft, steps, validateStep, type Draft, type ValidationError } from "../model/draft";
import { Chips, Field, FieldGroup, OptionCard, TextInput } from "./fields";

export function OnboardingWizard() {
  const profile = useStudentProfile();
  const today = useToday();
  if (profile === undefined || today === undefined) {
    return <Card className="h-[560px] animate-pulse bg-surface-2/50" aria-busy />;
  }
  return <Wizard existing={profile} today={today} />;
}

function Wizard({ existing, today }: { existing: StudentProfile | null; today: string }) {
  const { t, locale, href } = useI18n();
  const o = t.onboarding;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => createDraft(existing));
  const [error, setError] = useState<ValidationError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const days = weekdayNames(locale);

  const minTestDate = toISODate(addDays(parseISODate(today), 7));
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  };

  const previewProfile: StudentProfile = useMemo(
    () => ({ ...draft, planStartDate: today, createdAt: today }),
    [draft, today],
  );
  const baseline = useMemo(() => estimateBaseline(previewProfile), [previewProfile]);
  const plan = useMemo(
    () => (step === steps.length - 1 ? generateStudyPlan(previewProfile, locale) : null),
    [previewProfile, step, locale],
  );

  const isLast = step === steps.length - 1;

  function next(event?: FormEvent) {
    event?.preventDefault();
    const problem = validateStep(step, draft, minTestDate);
    if (problem) {
      setError(problem);
      return;
    }
    if (!isLast) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    studentRepository.save({
      ...draft,
      fullName: draft.fullName.trim(),
      email: draft.email.trim().toLowerCase(),
      lastScore: draft.scoreSource === "none" ? { rw: null, math: null } : draft.lastScore,
      planStartDate: toISODate(new Date()),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    progressRepository.reset();
    router.push(href(routes.dashboard));
  }

  const weeklyMinutes = draft.studyDays.length * draft.sessionMinutes;
  const localizedOptions = <T extends string>(list: { value: T }[], labels: Record<T, string>) =>
    list.map((item) => ({ value: item.value, label: labels[item.value] }));

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Qadamlar */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="lg:hidden">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">{o.steps[steps[step]].title}</span>
            <span className="text-muted">
              {step + 1} / {steps.length}
            </span>
          </div>
          <ProgressBar value={((step + 1) / steps.length) * 100} label={o.progressLabel} />
        </div>
        <div className="noise relative hidden overflow-hidden rounded-[2rem] bg-ink p-6 text-white lg:block">
          <div className="aurora opacity-70" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="relative">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#bfdbfe] uppercase">{o.eyebrow}</p>
            <p className="mt-2 font-display text-2xl leading-tight">
              {o.stepsCount(steps.length)} <span className="font-serif font-normal tracking-normal italic">{o.fiveMin}</span>
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#60a5fa] to-[#bfdbfe] transition-[width] duration-500"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
            <ol className="relative mt-6 space-y-1">
              {steps.map((id, i) => (
                <li key={id}>
                  <button
                    type="button"
                    disabled={i > step}
                    onClick={() => setStep(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                      i === step ? "bg-white/10 ring-1 ring-white/15" : "hover:bg-white/5 disabled:hover:bg-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition",
                        i < step && "bg-emerald-400 text-ink",
                        i === step && "bg-white text-ink shadow-[0_0_0_4px_rgb(139_125_255/0.35)]",
                        i > step && "text-white/40 ring-1 ring-white/20",
                      )}
                    >
                      {i < step ? <Icon name="check" className="size-4" strokeWidth={3} /> : i + 1}
                    </span>
                    <span>
                      <span className={cn("block text-sm font-semibold", i > step && "text-white/45")}>{o.steps[id].title}</span>
                      <span className="block text-xs text-white/45">{o.steps[id].hint}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex gap-3 rounded-2xl bg-white/[0.06] p-4 text-xs leading-relaxed text-white/60 ring-1 ring-white/10">
              <Icon name="shield" className="size-5 shrink-0 text-[#bfdbfe]" />
              {o.privacy}
            </div>
          </div>
        </div>
      </aside>

      <form onSubmit={next} noValidate className="min-w-0">
        <Card className="rounded-[2rem] p-6 shadow-lift sm:p-10">
          <div key={step} className="animate-fade-up space-y-8">
            {step === 0 && (
              <>
                <StepTitle eyebrow={o.eyebrow} title={o.s0.title} text={o.s0.text} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label={o.s0.name}>
                      <TextInput autoComplete="name" value={draft.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder={o.s0.namePh} />
                    </Field>
                  </div>
                  <Field label="Email">
                    <TextInput type="email" autoComplete="email" value={draft.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" />
                  </Field>
                  <Field label={o.s0.phone} hint={o.optional}>
                    <TextInput type="tel" autoComplete="tel" value={draft.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+998 90 123 45 67" />
                  </Field>
                </div>
                <FieldGroup label={o.s0.grade}>
                  <Chips name="grade" options={localizedOptions(gradeOptions, o.grades)} value={draft.grade} onChange={(v) => update("grade", v)} />
                </FieldGroup>
              </>
            )}

            {step === 1 && (
              <>
                <StepTitle eyebrow={o.eyebrow} title={o.s1.title} text={o.s1.text} />
                <FieldGroup label={o.s1.level}>
                  <div className="grid gap-3">
                    {levelOptions.map((opt) => (
                      <OptionCard
                        key={opt.value}
                        name="level"
                        active={draft.level === opt.value}
                        title={o.levels[opt.value].label}
                        description={o.levels[opt.value].description}
                        onSelect={() => update("level", opt.value)}
                      />
                    ))}
                  </div>
                </FieldGroup>
                <FieldGroup label={o.s1.english} hint="CEFR">
                  <Chips name="english" options={englishOptions} value={draft.englishLevel} onChange={(v) => update("englishLevel", v)} />
                </FieldGroup>
                <FieldGroup label={o.s1.source}>
                  <Chips name="source" options={localizedOptions(scoreSourceOptions, o.sources)} value={draft.scoreSource} onChange={(v) => update("scoreSource", v)} />
                </FieldGroup>
                {draft.scoreSource !== "none" && (
                  <div className="grid gap-5 rounded-2xl bg-surface-2/60 p-5 sm:grid-cols-2">
                    {(["rw", "math"] as const).map((key) => (
                      <Field key={key} label={key === "rw" ? "Reading & Writing" : "Math"} hint="200–800">
                        <TextInput
                          type="number"
                          inputMode="numeric"
                          min={200}
                          max={800}
                          step={10}
                          value={draft.lastScore[key] ?? ""}
                          onChange={(e) =>
                            update("lastScore", { ...draft.lastScore, [key]: e.target.value === "" ? null : Number(e.target.value) })
                          }
                          placeholder={o.s1.scorePh}
                        />
                      </Field>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <StepTitle eyebrow={o.eyebrow} title={o.s2.title} text={o.s2.text} />
                {sections.map((section) => (
                  <div key={section.id} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge tone={section.id === "rw" ? "accent" : "gold"}>{section.name}</Badge>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                    {getDomainsBySection(section.id).map((domain) => (
                      <RatingRow
                        key={domain.id}
                        id={domain.id}
                        title={t.domains[domain.id]}
                        description={domainDescription(domain, locale)}
                        labels={o.ratings}
                        value={draft.domainRatings[domain.id]}
                        onChange={(v) => update("domainRatings", { ...draft.domainRatings, [domain.id]: v })}
                      />
                    ))}
                  </div>
                ))}
                <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent">
                  {o.s2.baseline} <strong>{baseline.total}</strong> (RW {baseline.rw} · Math {baseline.math})
                  {draft.scoreSource !== "none" && ` — ${o.s2.fromScores}`}
                </p>
              </>
            )}

            {step === 3 && (
              <>
                <StepTitle eyebrow={o.eyebrow} title={o.s3.title} text={o.s3.text} />
                <div className="rounded-3xl border border-border bg-bg p-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted">{o.s3.target}</p>
                      <p className="font-display text-6xl leading-none tracking-tight">{draft.targetScore}</p>
                    </div>
                    <Badge tone={draft.targetScore - baseline.total > 250 ? "warning" : "success"}>
                      +{Math.max(0, draft.targetScore - baseline.total)} {t.common.points}
                    </Badge>
                  </div>
                  <input
                    type="range"
                    min={800}
                    max={1600}
                    step={10}
                    value={draft.targetScore}
                    onChange={(e) => update("targetScore", Number(e.target.value))}
                    className="mt-6 w-full accent-[var(--accent)]"
                    aria-label={o.s3.target}
                  />
                  <div className="mt-1 flex justify-between text-xs text-muted">
                    <span>800</span>
                    <span>{o.s3.percentile(draft.targetScore)}</span>
                    <span>1600</span>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={o.s3.testDate}>
                    <TextInput
                      type="date"
                      min={minTestDate}
                      value={draft.testDate ?? ""}
                      disabled={draft.testDate === null}
                      onChange={(e) => update("testDate", e.target.value || null)}
                    />
                  </Field>
                  <label className="flex items-center gap-3 self-end rounded-2xl border border-border bg-bg px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.testDate === null}
                      onChange={(e) => update("testDate", e.target.checked ? null : toISODate(addDays(parseISODate(today), 70)))}
                      className="size-4 accent-[var(--accent)]"
                    />
                    {o.s3.unknownDate}
                  </label>
                </div>
                <Field label={o.s3.universities} hint={o.optional}>
                  <TextInput value={draft.goals} onChange={(e) => update("goals", e.target.value)} placeholder={o.s3.universitiesPh} />
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                <StepTitle eyebrow={o.eyebrow} title={o.s4.title} text={o.s4.text} />
                <FieldGroup label={o.s4.days} hint={o.s4.daysCount(draft.studyDays.length)}>
                  <div className="grid grid-cols-7 gap-2">
                    {days.map((day, i) => {
                      const active = draft.studyDays.includes(i);
                      return (
                        <button
                          key={day}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            update(
                              "studyDays",
                              active ? draft.studyDays.filter((d) => d !== i) : [...draft.studyDays, i].sort(),
                            )
                          }
                          className={cn(
                            "h-14 rounded-2xl border text-sm font-medium transition",
                            active ? "border-accent bg-accent text-accent-fg" : "border-border bg-bg hover:border-fg/30",
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </FieldGroup>
                <FieldGroup label={o.s4.sessionLength}>
                  <Chips
                    name="minutes"
                    options={sessionLengthOptions.map((m) => ({ value: m, label: formatMinutes(m, locale) }))}
                    value={draft.sessionMinutes}
                    onChange={(v) => update("sessionMinutes", v)}
                  />
                </FieldGroup>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat label={o.s4.weekly} value={formatMinutes(weeklyMinutes, locale)} />
                  <Stat
                    label={o.s4.advice}
                    value={weeklyMinutes < 180 ? o.s4.adviceLow : weeklyMinutes > 900 ? o.s4.adviceHigh : o.s4.adviceOk}
                  />
                </div>
              </>
            )}

            {step === 5 && plan && (
              <>
                <StepTitle eyebrow={o.eyebrow} title={o.s5.title} text={o.s5.text} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label={o.s5.baseline} value={String(plan.baseline.total)} />
                  <Stat label={o.s5.target} value={String(plan.target.total)} accent />
                  <Stat label={o.s5.weeks} value={String(plan.weeks.length)} />
                  <Stat label={o.s5.sessions} value={String(plan.sessions.length)} />
                </div>
                <div className="space-y-2 rounded-2xl border border-border bg-bg p-5 text-sm">
                  <SummaryRow label={o.s5.student} value={`${draft.fullName} · ${o.grades[draft.grade]}`} />
                  <SummaryRow label={o.s5.level} value={`${o.levels[draft.level].label} · ${o.s5.english(draft.englishLevel)}`} />
                  <SummaryRow label={o.s3.testDate} value={draft.testDate ? formatDay(draft.testDate, locale, true) : o.s5.notSet} />
                  <SummaryRow
                    label={o.s5.schedule}
                    value={`${draft.studyDays.map((d) => days[d]).join(", ")} · ${formatMinutes(draft.sessionMinutes, locale)}`}
                  />
                  <SummaryRow label={o.s5.focus} value={plan.domainFocus.slice(0, 2).map((d) => d.name).join(", ")} />
                  <SummaryRow label={o.s5.tests} value={o.s5.practiceTests(plan.practiceTests)} />
                </div>
                {plan.feasibility !== "realistic" && (
                  <p className="rounded-2xl bg-warning-soft px-4 py-3 text-sm text-warning">
                    {o.s5.ambitious(plan.expectedGain)}
                    {plan.extraSessionsPerWeek > 0 && ` ${o.s5.extra(plan.extraSessionsPerWeek)}`}
                    {plan.suggestLaterDate && ` ${o.s5.later}`}
                  </p>
                )}
              </>
            )}

            {error && (
              <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
                {o.errors[error]}
              </p>
            )}
          </div>

          <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submitting}>
              <Icon name="arrowLeft" className="size-4" /> {t.common.back}
            </Button>
            <Button type="submit" size="lg" disabled={submitting}>
              {isLast ? (submitting ? o.saving : existing ? o.update : o.create) : o.next}
              {!isLast && <Icon name="arrowRight" className="size-4" />}
            </Button>
          </div>
        </Card>
        {existing && step === steps.length - 1 && <p className="mt-4 text-center text-xs text-muted">{o.updateNote}</p>}
      </form>
    </div>
  );
}

function StepTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">{eyebrow}</p>
      <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{title}</h1>
      <p className="mt-2 text-muted">{text}</p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-border p-4", accent ? "bg-accent-soft" : "bg-bg")}>
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tracking-tight", accent && "text-accent")}>{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function RatingRow({
  id,
  title,
  description,
  labels,
  value,
  onChange,
}: {
  id: DomainId;
  title: string;
  description: string;
  labels: string[];
  value: Rating;
  onChange: (v: Rating) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-bg p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
      <div className="shrink-0">
        <div role="radiogroup" aria-label={title} className="flex gap-1 rounded-full bg-surface-2 p-1">
          {([1, 2, 3, 4, 5] as Rating[]).map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={value === r}
              title={labels[r - 1]}
              onClick={() => onChange(r)}
              className={cn(
                "size-9 rounded-full text-sm font-medium transition",
                value === r ? "bg-accent text-accent-fg shadow-card" : "text-muted hover:text-fg",
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <p className="mt-1 text-center text-[11px] text-muted" id={`${id}-label`}>
          {labels[value - 1]}
        </p>
      </div>
    </div>
  );
}
