"use client";

import { useState } from "react";

import { MathTools, QuestionCard, isAnswered, type AnswerValue, type Question } from "@/entities/practice-test";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Card } from "@/shared/ui/primitives";

import { Countdown } from "./countdown";

export interface ModuleResult {
  answers: AnswerValue[];
  times: number[];
  timedOut: boolean;
}

/**
 * Bitta vaqtli modul (Bluebook uslubida): savollar, “Belgilash”, navigator va taymer.
 * Modul tugagach unga qaytib bo'lmaydi — natija `onFinish` orqali qaytadi.
 */
export function ModuleRunner({
  title,
  subtitle,
  questions,
  minutes,
  finishLabel,
  confirmText,
  onFinish,
}: {
  title: string;
  subtitle: string;
  questions: Question[];
  minutes: number;
  finishLabel: string;
  confirmText: (unanswered: number) => string;
  onFinish: (result: ModuleResult) => void;
}) {
  const { t } = useI18n();
  const limitMs = minutes * 60_000;
  const [answers, setAnswers] = useState<AnswerValue[]>(() => questions.map(() => null));
  const [times, setTimes] = useState<number[]>(() => questions.map(() => 0));
  const [marked, setMarked] = useState<Set<number>>(() => new Set());
  const [index, setIndex] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [enteredAt, setEnteredAt] = useState(() => Date.now());
  const [done, setDone] = useState(false);

  const unanswered = answers.filter((a) => !isAnswered(a)).length;
  const q = questions[index];

  function commitTime() {
    const current = Date.now();
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

  function finish(timedOut: boolean) {
    if (done) return;
    setDone(true);
    onFinish({ answers, times: commitTime(), timedOut });
  }

  function toggleMark() {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const confirmFinish = () => window.confirm(confirmText(unanswered)) && finish(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
      <div className="min-w-0 space-y-4">
        <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted">
              {subtitle} · {t.runner.question} {index + 1} {t.runner.of} {questions.length}
            </p>
          </div>
          <Countdown startedAt={startedAt} limitMs={limitMs} onExpire={() => finish(true)} />
        </Card>

        <QuestionCard
          key={q.id}
          question={q}
          number={index + 1}
          selected={answers[index]}
          onSelect={(value) => setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)))}
          headerExtra={
            <button
              type="button"
              onClick={toggleMark}
              aria-pressed={marked.has(index)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                marked.has(index) ? "bg-warning-soft text-warning" : "text-muted hover:bg-surface-2",
              )}
            >
              <Icon name="flag" className="size-4" />
              {marked.has(index) ? t.runner.marked : t.runner.mark}
            </button>
          }
        />

        {q.sectionId === "math" && <MathTools />}

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => goTo(index - 1)} disabled={index === 0}>
            <Icon name="arrowLeft" className="size-4" /> {t.runner.prev}
          </Button>
          {index < questions.length - 1 ? (
            <Button onClick={() => goTo(index + 1)}>
              {t.runner.next} <Icon name="arrowRight" className="size-4" />
            </Button>
          ) : (
            <Button onClick={confirmFinish}>
              <Icon name="check" className="size-4" /> {finishLabel}
            </Button>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Card className="p-5">
          <p className="text-sm font-semibold">{t.runner.navigator}</p>
          <div className="mt-4 grid grid-cols-6 gap-2 lg:grid-cols-4">
            {questions.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === index ? "step" : undefined}
                aria-label={`${t.runner.question} ${i + 1}`}
                className={cn(
                  "relative grid aspect-square place-items-center rounded-xl text-sm font-semibold transition",
                  isAnswered(answers[i]) ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-fg",
                  i === index && "ring-2 ring-fg ring-offset-2 ring-offset-surface",
                )}
              >
                {i + 1}
                {marked.has(i) && <span className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-surface bg-warning" />}
              </button>
            ))}
          </div>
          <Button className="mt-5 w-full" variant="secondary" onClick={confirmFinish}>
            {finishLabel}
          </Button>
        </Card>
      </aside>
    </div>
  );
}
