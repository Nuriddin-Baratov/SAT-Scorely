"use client";

import {
  correctAnswerText,
  formatAnswer,
  getTestQuestions,
  isCorrect,
  summarizeAttempt,
  type PracticeTest,
  type TestAttempt,
} from "@/entities/practice-test";
import { estimatePercentile } from "@/entities/sat";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { cn, formatDuration } from "@/shared/lib";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card, ProgressRing } from "@/shared/ui/primitives";


export interface TestReward {
  xp: number;
  levelUp: boolean;
  newMistakes: number;
}

export function TestReview({
  test,
  attempt,
  timedOut,
  reward,
  onRetry,
}: {
  test: PracticeTest;
  attempt: TestAttempt;
  timedOut: boolean;
  reward: TestReward;
  onRetry: () => void;
}) {
  const { t, locale, href } = useI18n();
  const questions = getTestQuestions(test, attempt);
  const summary = summarizeAttempt(test, attempt);
  const pct = Math.round(summary.accuracy * 100);

  return (
    <div className="space-y-6">
      {timedOut && (
        <p className="flex items-center gap-2 rounded-2xl bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
          <Icon name="clock" className="size-4" /> {t.runner.timeUp}
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="noise relative bg-ink p-6 text-white sm:p-8">
          <div className="aurora opacity-60" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative grid size-28 shrink-0 place-items-center">
              <ProgressRing value={pct} size={112} stroke={10} />
              <span className="absolute font-display text-3xl font-bold">{pct}%</span>
            </div>
            <div>
              <p className="text-sm text-white/60">{test.title[locale]}</p>
              <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{t.runner.resultTitle}</h1>
              <p className="mt-2 text-white/70">
                {t.runner.correct}: <strong className="text-white">{summary.correct}</strong> / {summary.total} ·{" "}
                {t.runner.time}: <strong className="text-white">{formatDuration(attempt.durationSec)}</strong>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1cf8b]/15 px-3 py-1 text-sm font-semibold text-[#f1cf8b]">
                  <Icon name="star" className="size-4" /> +{reward.xp} XP
                </span>
                {reward.levelUp && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-300">
                    <Icon name="trending" className="size-4" /> {t.game.levelUp}
                  </span>
                )}
                {attempt.path && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
                    <Icon name={attempt.path === "hard" ? "bolt" : "layers"} className="size-4" />
                    {attempt.path === "hard" ? t.adaptive.hardTitle : t.adaptive.easyTitle}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2">
          {(Object.entries(summary.sectionScores) as [keyof typeof t.sections, number][]).map(([section, score]) => (
            <div key={section} className="bg-surface p-6">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                {t.runner.estimate} · {t.sections[section]}
              </p>
              <p className="mt-2 font-display text-4xl font-bold">
                {score}
                <span className="text-base font-medium text-muted"> / 800</span>
              </p>
            </div>
          ))}
        </div>
        {summary.sectionScores.rw !== undefined && summary.sectionScores.math !== undefined && (
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border bg-accent-soft/60 px-6 py-5">
            <div>
              <p className="text-xs font-semibold tracking-wide text-accent uppercase">{t.calculator.total}</p>
              <p className="mt-1 font-display text-5xl font-bold text-accent tabular-nums">
                {summary.sectionScores.rw + summary.sectionScores.math}
                <span className="text-lg font-medium text-muted"> / 1600</span>
              </p>
            </div>
            <p className="text-sm text-muted">
              {t.calculator.percentile}: <strong className="text-fg">≈{estimatePercentile(summary.sectionScores.rw + summary.sectionScores.math)}%</strong>
            </p>
          </div>
        )}
        <p className="border-t border-border px-6 py-3 text-xs text-muted">{t.runner.estimateNote}</p>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onRetry}>
          <Icon name="refresh" className="size-4" /> {t.runner.retry}
        </Button>
        <ButtonLink href={href(routes.results)} variant="outline">
          <Icon name="chart" className="size-4" /> {t.runner.toResults}
        </ButtonLink>
        {reward.newMistakes > 0 && (
          <ButtonLink href={href(routes.mistakes)} variant="outline">
            <Icon name="refresh" className="size-4" /> {t.mistakes.addedFromTest(reward.newMistakes)}
          </ButtonLink>
        )}
        <ButtonLink href={href(routes.tests)} variant="ghost">
          {t.runner.exit}
        </ButtonLink>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">{t.runner.review}</h2>
        {questions.map((q, i) => {
          const given = attempt.answers[i];
          const ok = isCorrect(q, given);
          return (
            <Card key={q.id} className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full text-white",
                    ok ? "bg-success" : formatAnswer(q, given) === null ? "bg-muted" : "bg-danger",
                  )}
                  aria-hidden
                >
                  <Icon name={ok ? "check" : "x"} className="size-4" strokeWidth={2.6} />
                </span>
                <span className="font-semibold">
                  {t.runner.question} {i + 1}
                </span>
                <Badge tone={q.sectionId === "rw" ? "accent" : "gold"}>{t.domains[q.domainId]}</Badge>
                <Badge>{t.levels[q.difficulty]}</Badge>
              </div>

              <div lang="en" className="mt-4 space-y-3 text-sm leading-relaxed">
                {q.passage && <p className="rounded-xl bg-surface-2/60 p-4">{q.passage}</p>}
                <p className="whitespace-pre-line">{q.prompt}</p>
              </div>

              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div className={cn("rounded-xl px-4 py-3", ok ? "bg-success-soft" : "bg-danger-soft")}>
                  <dt className="text-xs font-semibold text-muted">{t.runner.yourAnswer}</dt>
                  <dd lang="en" className="mt-0.5 font-medium">
                    {formatAnswer(q, given) ?? t.runner.noAnswer}
                  </dd>
                </div>
                <div className="rounded-xl bg-success-soft px-4 py-3">
                  <dt className="text-xs font-semibold text-muted">{t.runner.correctAnswer}</dt>
                  <dd lang="en" className="mt-0.5 font-medium">
                    {correctAnswerText(q)}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 rounded-xl border border-border p-4 text-sm leading-relaxed">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent">
                  <Icon name="sparkles" className="size-3.5" /> {t.runner.explanation}
                </p>
                {q.explanation[locale]}
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
