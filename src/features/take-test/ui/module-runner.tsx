"use client";

import { useState } from "react";

import { MathTools, QuestionCard, isAnswered, type AnswerValue, type Question } from "@/entities/practice-test";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { useFocusMode } from "@/shared/lib/react";
import { Button } from "@/shared/ui/button";
import { confirmDialog } from "@/shared/ui/confirm";
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
/** Joriy vaqt — faqat hodisa ishlovchilarida chaqiriladi (React Compiler lint uchun alohida funksiya). */
const nowMs = () => Date.now();

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

  useFocusMode(!done);

  const confirmFinish = async () => {
    // Hamma savolga javob berilgan — so'ramasdan yakunlaymiz; javobsiz qolgan bo'lsa ogohlantiramiz
    const ok =
      unanswered === 0 ||
      (await confirmDialog({
        title: finishLabel,
        text: confirmText(unanswered),
        tone: "warning",
        confirm: finishLabel,
        cancel: t.confirm.back,
      }));
    if (ok) finish(false);
  };

  const answeredCount = questions.length - unanswered;
  const isLast = index >= questions.length - 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
      <div className="min-w-0 space-y-3 sm:space-y-4">
        <div className="sticky top-0 z-30 -mx-4 border-b border-border bg-surface/95 px-4 pt-3 pb-2 backdrop-blur-xl sm:static sm:mx-0 sm:rounded-2xl sm:border sm:px-5 sm:py-4 sm:shadow-card">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted tabular-nums">
                {subtitle} · {t.runner.question} {index + 1} {t.runner.of} {questions.length}
              </p>
            </div>
            <Countdown startedAt={startedAt} limitMs={limitMs} onExpire={() => finish(true)} />
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>
          <div className="-mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden" aria-label={t.runner.navigator}>
            {questions.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === index ? "step" : undefined}
                aria-label={`${t.runner.question} ${i + 1}`}
                className={cn(
                  "relative grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold tabular-nums transition",
                  i === index ? "bg-fg text-bg" : isAnswered(answers[i]) ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted",
                )}
              >
                {i + 1}
                {marked.has(i) && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface bg-warning" />}
              </button>
            ))}
          </div>
        </div>

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

        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border bg-surface/95 px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <Button
            variant="outline"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
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

      <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
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
