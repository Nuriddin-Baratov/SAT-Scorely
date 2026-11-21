"use client";

import { useId, useState } from "react";

import {
  estimatePercentile,
  requiredAccuracy,
  scaleSection,
  scoreBandOf,
  sectionQuestionCount,
  type SectionId,
} from "@/entities/sat";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { ButtonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card, Container, SectionHeading } from "@/shared/ui/primitives";

type Mode = "score" | "target";
const SECTIONS: SectionId[] = ["rw", "math"];

export function ScoreCalculatorPage() {
  const { t, href } = useI18n();
  const [mode, setMode] = useState<Mode>("score");
  const [correct, setCorrect] = useState<Record<SectionId, number>>({ rw: 40, math: 32 });
  const [target, setTarget] = useState(1400);

  const sectionScores = { rw: scaleSection(correct.rw / sectionQuestionCount.rw), math: scaleSection(correct.math / sectionQuestionCount.math) };
  const total = sectionScores.rw + sectionScores.math;

  const needed = Object.fromEntries(
    SECTIONS.map((s) => [s, Math.min(sectionQuestionCount[s], Math.ceil(requiredAccuracy(target / 2) * sectionQuestionCount[s]))]),
  ) as Record<SectionId, number>;
  const allowedMistakes = sectionQuestionCount.rw + sectionQuestionCount.math - needed.rw - needed.math;

  const shownTotal = mode === "score" ? total : target;

  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-5 sm:py-16">
        <SectionHeading eyebrow={t.calculator.eyebrow} title={t.calculator.title} description={t.calculator.description} />

        <div className="mt-4 inline-flex rounded-full bg-surface-2 p-1 sm:mt-10" role="tablist">
          {(["score", "target"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition",
                mode === m ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
              )}
            >
              {m === "score" ? t.calculator.modeScore : t.calculator.modeTarget}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Card className="space-y-8 p-6 sm:p-8">
            {mode === "score" ? (
              SECTIONS.map((s) => (
                <RangeField
                  key={s}
                  label={t.sections[s]}
                  hint={t.calculator.correctOf(sectionQuestionCount[s])}
                  value={correct[s]}
                  min={0}
                  max={sectionQuestionCount[s]}
                  tone={s === "rw" ? "accent" : "gold"}
                  suffix={`→ ${sectionScores[s]}`}
                  onChange={(v) => setCorrect((prev) => ({ ...prev, [s]: v }))}
                />
              ))
            ) : (
              <>
                <RangeField
                  label={t.calculator.targetLabel}
                  hint="400–1600"
                  value={target}
                  min={800}
                  max={1600}
                  step={10}
                  tone="accent"
                  onChange={setTarget}
                />
                <div className="rounded-2xl bg-surface-2/70 p-5">
                  <p className="text-sm font-semibold">{t.calculator.needed}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {SECTIONS.map((s) => (
                      <div key={s} className="rounded-xl bg-surface p-4 shadow-card">
                        <p className="text-xs text-muted">{t.sections[s]}</p>
                        <p className="mt-1 font-display text-3xl font-bold tabular-nums">
                          {needed[s]}
                          <span className="text-base font-medium text-muted"> / {sectionQuestionCount[s]}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-muted">{t.calculator.mistakes(Math.max(0, allowedMistakes))}</p>
                </div>
              </>
            )}
          </Card>

          <ScoreCard total={shownTotal} sectionScores={mode === "score" ? sectionScores : { rw: target / 2, math: target / 2 }} />
        </div>

        <p className="mt-6 flex gap-2 text-xs leading-relaxed text-muted">
          <Icon name="shield" className="size-4 shrink-0" /> {t.calculator.disclaimer}
        </p>

        <Card className="mt-10 flex flex-col items-start justify-between gap-6 p-7 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-xl font-bold">{t.calculator.ctaTitle}</h2>
            <p className="mt-1 text-muted">{t.calculator.ctaText}</p>
          </div>
          <ButtonLink href={href(routes.onboarding)} size="lg">
            {t.calculator.cta} <Icon name="arrowRight" className="size-4.5" />
          </ButtonLink>
        </Card>
      </Container>
    </main>
  );
}

function ScoreCard({ total, sectionScores }: { total: number; sectionScores: Record<SectionId, number> }) {
  const { t } = useI18n();
  const band = scoreBandOf(total);
  const pct = ((total - 400) / 1200) * 100;

  return (
    <div className="noise relative overflow-hidden rounded-3xl bg-ink p-7 text-white shadow-lift sm:p-8">
      <div className="aurora opacity-70" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white/60">{t.calculator.total}</p>
          <Badge className="bg-white/10 text-white">
            {t.calculator.band}: {t.scoreBands[band]}
          </Badge>
        </div>
        <p className="mt-2 font-display text-7xl font-bold tabular-nums" aria-live="polite">
          {total}
        </p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[#60a5fa] to-[#bfdbfe] transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-white/40">
          <span>400</span>
          <span>1600</span>
        </div>

        <dl className="mt-7 grid grid-cols-3 gap-3">
          {SECTIONS.map((s) => (
            <div key={s} className="rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-white/10">
              <dt className="truncate text-[11px] text-white/50">{t.sections[s]}</dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{sectionScores[s]}</dd>
            </div>
          ))}
          <div className="rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-white/10">
            <dt className="truncate text-[11px] text-white/50">{t.calculator.percentile}</dt>
            <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{estimatePercentile(total)}%</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function RangeField({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  tone,
  suffix,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  tone: "accent" | "gold";
  suffix?: string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v / step) * step));

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <label htmlFor={id} className="font-semibold">
            {label}
          </label>
          <p className="text-xs text-muted">{hint}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            aria-label={label}
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
            className="h-10 w-20 rounded-xl border border-border bg-surface px-3 text-right font-semibold tabular-nums outline-none focus:border-accent"
          />
          {suffix && <span className="w-14 text-sm font-semibold text-muted tabular-nums">{suffix}</span>}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn("mt-4 w-full", tone === "accent" ? "accent-[var(--accent)]" : "accent-[var(--gold)]")}
      />
    </div>
  );
}
