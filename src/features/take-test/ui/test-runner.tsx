"use client";

import { useState } from "react";

import { gameRepository } from "@/entities/gamification";
import { mistakesRepository } from "@/entities/mistake";
import { studentRepository } from "@/entities/student";
import {
  MathTools,
  QuestionCard,
  attemptsRepository,
  certificatesRepository,
  chooseAdaptivePath,
  getTestQuestions,
  moduleTwoQuestions,
  isAnswered,
  summarizeAttempt,
  type AdaptivePath,
  type AnswerValue,
  type PracticeTest,
  type Question,
  type TestAttempt,
} from "@/entities/practice-test";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { useFocusMode } from "@/shared/lib/react";
import { Button, ButtonLink } from "@/shared/ui/button";
import { launchConfetti } from "@/shared/ui/confetti";
import { Icon } from "@/shared/ui/icon";
import { Card } from "@/shared/ui/primitives";

import { Countdown } from "./countdown";
import { TestReview, type TestReward } from "./test-review";

export function TestRunner({ test }: { test: PracticeTest }) {
  const [run, setRun] = useState(0);
  return <TestRun key={run} test={test} onRetry={() => setRun((n) => n + 1)} />;
}

type Phase = "running" | "break";

/**
 * Joriy vaqt. Faqat hodisa ishlovchilarida (tugma bosilganda, taymer tugaganda) chaqiriladi;
 * React Compiler lint'i buni render deb noto'g'ri baholamasligi uchun alohida funksiya.
 */
const nowMs = () => Date.now();

function TestRun({ test, onRetry }: { test: PracticeTest; onRetry: () => void }) {
  const { t, locale, href } = useI18n();
  const limitMs = test.minutes * 60_000;
  const isAdaptive = !!test.adaptive;
  const moduleOneLength = test.questionIds.length;

  const [questions, setQuestions] = useState<Question[]>(() => getTestQuestions(test));
  const [answers, setAnswers] = useState<AnswerValue[]>(() => questions.map(() => null));
  // Har bir savolga sarflangan vaqt (soniya) va joriy savolga kirilgan vaqt
  const [times, setTimes] = useState<number[]>(() => questions.map(() => 0));
  const [enteredAt, setEnteredAt] = useState(() => Date.now());
  const [marked, setMarked] = useState<Set<number>>(() => new Set());
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("running");
  const [path, setPath] = useState<AdaptivePath | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [result, setResult] = useState<{ attempt: TestAttempt; reward: TestReward; timedOut: boolean } | null>(null);
  // Test ketayotganda mobil navbar va sarlavha yashiriladi
  useFocusMode(!result);

  const inModuleTwo = path !== null;
  const firstIndex = inModuleTwo ? moduleOneLength : 0;
  const lastIndex = questions.length - 1;
  const awaitingModuleTwo = isAdaptive && !inModuleTwo;
  const visible = questions.map((q, i) => ({ q, i })).filter(({ i }) => i >= firstIndex);
  const unanswered = visible.filter(({ i }) => !isAnswered(answers[i])).length;
  const q = questions[index];

  /** Joriy savoldagi vaqtni hisobga olib, boshqa savolga o'tadi */
  function commitTime() {
    const current = nowMs();
    const spent = Math.round((current - enteredAt) / 1000);
    setEnteredAt(current);
    const next = times.map((sec, i) => (i === index ? sec + spent : sec));
    setTimes(next);
    return next;
  }

  function goTo(i: number) {
    commitTime();
    setIndex(i);
  }

  function finish(timedOut = false) {
    if (result) return;
    const finalTimes = commitTime();
    const elapsed = nowMs() - startedAt;
    const attempt = attemptsRepository.add({
      testId: test.id,
      finishedAt: new Date().toISOString(),
      durationSec: Math.round(Math.min(elapsed, limitMs) / 1000),
      answers,
      questionIds: questions.map((item) => item.id),
      times: finalTimes,
      ...(path ? { path } : {}),
    });
    const summary = summarizeAttempt(test, attempt);
    // Yakuniy test yakunlandi — natijadan qat'i nazar sertifikat beriladi (id = urinish id'si)
    if (test.final) {
      certificatesRepository.issue({
        id: attempt.id,
        name: studentRepository.get()?.fullName || t.certificate.student,
        accuracy: summary.accuracy,
        correct: summary.correct,
        total: summary.total,
        scores: summary.sectionScores,
        issuedAt: attempt.finishedAt,
      });
    }
    mistakesRepository.addWrong(summary.wrongIds);
    const game = gameRepository.track({ type: "test", correct: summary.correct, total: summary.total, hardModule: path === "hard" });
    if (summary.accuracy >= 0.8) launchConfetti();
    setResult({ attempt, timedOut, reward: { xp: game.gained, levelUp: game.levelUp, newMistakes: summary.wrongIds.length } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (result) {
    return <TestReview test={test} attempt={result.attempt} timedOut={result.timedOut} reward={result.reward} onRetry={onRetry} />;
  }

  function endModuleOne() {
    const chosen = chooseAdaptivePath(test, answers.slice(0, moduleOneLength));
    const extra = moduleTwoQuestions(test, chosen);
    setPath(chosen);
    const base = commitTime();
    setQuestions((prev) => [...prev, ...extra]);
    setAnswers((prev) => [...prev, ...extra.map(() => null)]);
    setTimes([...base, ...extra.map(() => 0)]);
    setIndex(moduleOneLength);
    setPhase("break");
  }

  function confirmFinish() {
    if (awaitingModuleTwo) {
      if (window.confirm(t.adaptive.confirmModule(unanswered))) endModuleOne();
      return;
    }
    if (window.confirm(t.runner.confirmFinish(unanswered))) finish();
  }

  function toggleMark() {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const finishLabel = awaitingModuleTwo ? t.adaptive.finishModule : t.runner.finish;

  if (phase === "break" && path) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center sm:p-10">
        <span
          className={cn(
            "mx-auto grid size-16 place-items-center rounded-2xl",
            path === "hard" ? "bg-gold-soft text-gold" : "bg-accent-soft text-accent",
          )}
        >
          <Icon name={path === "hard" ? "bolt" : "layers"} className="size-7" />
        </span>
        <p className="mt-6 text-sm font-semibold text-muted">{t.adaptive.moduleDone}</p>
        <h1 className="mt-2 text-3xl font-bold">{path === "hard" ? t.adaptive.hardTitle : t.adaptive.easyTitle}</h1>
        <p className="mt-3 leading-relaxed text-muted">{path === "hard" ? t.adaptive.hardText : t.adaptive.easyText}</p>
        <Button
          size="lg"
          className="mt-8"
          onClick={() => {
            setEnteredAt(Date.now());
            setPhase("running");
          }}
        >
          {t.adaptive.startModule2} <Icon name="arrowRight" className="size-4" />
        </Button>
      </Card>
    );
  }

  const position = index - firstIndex + 1;
  const answeredCount = visible.length - unanswered;
  const isLast = index >= lastIndex;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
      <div className="min-w-0 space-y-3 sm:space-y-4">
        {/* Yuqori panel: mobilda ekran tepasiga yopishadi (fokus rejimida sayt sarlavhasi yashirin) */}
        <div className="sticky top-0 z-30 -mx-4 border-b border-border bg-surface/95 px-4 pt-3 pb-2 backdrop-blur-xl sm:static sm:mx-0 sm:rounded-2xl sm:border sm:px-5 sm:py-4 sm:shadow-card">
          <div className="flex items-center gap-3">
            <ButtonLink
              href={href(routes.tests)}
              variant="ghost"
              size="sm"
              className="-ml-2 size-9 shrink-0 px-0! lg:hidden"
              aria-label={t.runner.exit}
            >
              <Icon name="x" className="size-5" />
            </ButtonLink>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{test.title[locale]}</p>
              <p className="text-xs text-muted tabular-nums">
                {isAdaptive && `${inModuleTwo ? t.adaptive.module2 : t.adaptive.module1} · `}
                {t.runner.question} {position} {t.runner.of} {visible.length}
              </p>
            </div>
            <Countdown startedAt={startedAt} limitMs={limitMs} onExpire={() => finish(true)} />
          </div>
          {/* Progress + savol raqamlari (mobil navigator) */}
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(answeredCount / visible.length) * 100}%` }} />
          </div>
          <div className="-mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden" aria-label={t.runner.navigator}>
            {visible.map(({ q: item, i }) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === index ? "step" : undefined}
                aria-label={`${t.runner.question} ${i - firstIndex + 1}`}
                className={cn(
                  "relative grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold tabular-nums transition",
                  i === index
                    ? "bg-fg text-bg"
                    : isAnswered(answers[i])
                      ? "bg-accent-soft text-accent"
                      : "bg-surface-2 text-muted",
                )}
              >
                {i - firstIndex + 1}
                {marked.has(i) && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface bg-warning" />}
              </button>
            ))}
          </div>
        </div>

        <QuestionCard
          question={q}
          number={position}
          selected={answers[index]}
          onSelect={(choice) => setAnswers((prev) => prev.map((a, i) => (i === index ? choice : a)))}
          headerExtra={
            <button
              type="button"
              onClick={toggleMark}
              aria-pressed={marked.has(index)}
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition lg:inline-flex",
                marked.has(index) ? "bg-warning-soft text-warning" : "text-muted hover:bg-surface-2",
              )}
            >
              <Icon name="flag" className="size-4" />
              {marked.has(index) ? t.runner.marked : t.runner.mark}
            </button>
          }
        />

        {q.sectionId === "math" && <MathTools />}

        {/* Harakat paneli: mobilda ekran pastiga yopishgan, bosh barmoq yetadigan joyda */}
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border bg-surface/95 px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <Button
            variant="outline"
            onClick={() => goTo(index - 1)}
            disabled={index === firstIndex}
            className="size-12 shrink-0 px-0! lg:h-11 lg:w-auto lg:px-5!"
            aria-label={t.runner.prev}
          >
            <Icon name="arrowLeft" className="size-5 lg:size-4" />
            <span className="hidden lg:inline">{t.runner.prev}</span>
          </Button>
          <Button
            variant="outline"
            onClick={toggleMark}
            aria-pressed={marked.has(index)}
            aria-label={marked.has(index) ? t.runner.marked : t.runner.mark}
            className={cn("size-12 shrink-0 px-0! lg:hidden", marked.has(index) && "border-warning bg-warning-soft text-warning")}
          >
            <Icon name="flag" className="size-5" />
          </Button>
          <div className="flex-1 lg:hidden" />
          {!isLast ? (
            <Button onClick={() => goTo(index + 1)} className="h-12 flex-[2] text-base lg:ml-auto lg:h-11 lg:flex-none lg:text-sm">
              {t.runner.next} <Icon name="arrowRight" className="size-4" />
            </Button>
          ) : (
            <Button onClick={confirmFinish} className="h-12 flex-[2] text-base lg:ml-auto lg:h-11 lg:flex-none lg:text-sm">
              <Icon name="check" className="size-4" /> {finishLabel}
            </Button>
          )}
        </div>
      </div>

      <aside className="hidden space-y-4 lg:sticky lg:top-6 lg:block lg:self-start">
        <Card className="p-5">
          <p className="text-sm font-semibold">{t.runner.navigator}</p>
          <div className="mt-4 grid grid-cols-6 gap-2 lg:grid-cols-4">
            {visible.map(({ q: item, i }) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === index ? "step" : undefined}
                aria-label={`${t.runner.question} ${i - firstIndex + 1}`}
                className={cn(
                  "relative grid aspect-square place-items-center rounded-xl text-sm font-semibold transition",
                  isAnswered(answers[i]) ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-fg",
                  i === index && "ring-2 ring-fg ring-offset-2 ring-offset-surface",
                )}
              >
                {i - firstIndex + 1}
                {marked.has(i) && <span className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-surface bg-warning" />}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-1.5 text-xs text-muted">
            <p className="flex items-center gap-2"><span className="size-3 rounded bg-accent" /> {t.runner.answered}</p>
            <p className="flex items-center gap-2"><span className="size-3 rounded bg-surface-2 ring-1 ring-border" /> {t.runner.unanswered}</p>
            <p className="flex items-center gap-2"><span className="size-3 rounded-full bg-warning" /> {t.runner.marked}</p>
          </div>
          <Button className="mt-5 w-full" variant="secondary" onClick={confirmFinish}>
            {finishLabel}
          </Button>
        </Card>
        <ButtonLink href={href(routes.tests)} variant="ghost" size="sm" className="w-full">
          <Icon name="arrowLeft" className="size-4" /> {t.runner.exit}
        </ButtonLink>
      </aside>
    </div>
  );
}
