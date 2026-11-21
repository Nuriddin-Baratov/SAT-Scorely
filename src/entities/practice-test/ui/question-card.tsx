"use client";

import type { ReactNode } from "react";

import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card } from "@/shared/ui/primitives";

import { correctAnswerText, isAnswered, isCorrect } from "../model/answer";
import type { AnswerValue, ChoiceQuestion, Question, SprQuestion } from "../model/types";

const LETTERS = ["A", "B", "C", "D"];

/**
 * Bitta savol: matn, variantlar (yoki SPR javob maydoni) va (ixtiyoriy) tushuntirish.
 * `reveal` — to'g'ri javob va tushuntirishni ko'rsatish (javob bloklanadi).
 */
export function QuestionCard({
  question,
  selected,
  onSelect,
  reveal = false,
  number,
  headerExtra,
  className,
}: {
  question: Question;
  selected: AnswerValue;
  onSelect?: (answer: AnswerValue) => void;
  reveal?: boolean;
  number?: number;
  headerExtra?: ReactNode;
  className?: string;
}) {
  const { t, locale } = useI18n();
  const q = question;
  const correct = isCorrect(q, selected);

  return (
    <Card className={cn("p-4 sm:p-8", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {number !== undefined && (
            <span className="grid size-7 place-items-center rounded-lg bg-fg text-xs font-bold text-bg sm:size-8 sm:text-sm">{number}</span>
          )}
          <Badge tone={q.sectionId === "rw" ? "accent" : "gold"}>{t.domains[q.domainId]}</Badge>
          <Badge>{t.levels[q.difficulty]}</Badge>
          {q.format === "spr" && <Badge tone="success">{t.spr.badge}</Badge>}
        </div>
        {headerExtra}
      </div>

      <div lang="en" className="mt-4 sm:mt-6">
        {q.passage && (
          <blockquote className="mb-4 rounded-xl border-l-4 border-accent bg-surface-2/60 p-3.5 text-[15px] leading-relaxed whitespace-pre-line sm:mb-6 sm:rounded-2xl sm:p-5 sm:text-base">
            <span className="sr-only">{t.runner.passage}: </span>
            {q.passage}
          </blockquote>
        )}
        <p className="text-[15px] leading-relaxed font-medium whitespace-pre-line sm:text-base">{q.prompt}</p>

        {q.format === "spr" ? (
          <SprInput question={q} value={selected} onChange={onSelect} reveal={reveal} correct={correct} />
        ) : (
          <Choices question={q} selected={selected} onSelect={onSelect} reveal={reveal} />
        )}
      </div>

      {reveal && (
        <div className="mt-4 rounded-2xl border border-border bg-surface-2/40 p-4 text-sm leading-relaxed sm:mt-5" role="status">
          <p className={cn("mb-1 flex items-center gap-1.5 text-xs font-semibold", correct ? "text-success" : "text-danger")}>
            <Icon name={correct ? "check" : "x"} className="size-3.5" strokeWidth={2.6} />
            {correct ? t.practice.correct : !isAnswered(selected) ? t.runner.noAnswer : t.practice.incorrect}
            <span className="font-normal text-muted">· {t.runner.explanation}</span>
          </p>
          {q.explanation[locale]}
        </div>
      )}
    </Card>
  );
}

function Choices({
  question: q,
  selected,
  onSelect,
  reveal,
}: {
  question: ChoiceQuestion;
  selected: AnswerValue;
  onSelect?: (answer: AnswerValue) => void;
  reveal: boolean;
}) {
  return (
    <div className="mt-4 grid gap-2 sm:mt-6 sm:gap-2.5" role="radiogroup" aria-label={q.prompt.split("\n")[0]}>
      {q.choices.map((choice, i) => {
        const isSelected = selected === i;
        const isRight = reveal && i === q.answer;
        const isWrong = reveal && isSelected && i !== q.answer;
        return (
          <button
            key={choice}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={reveal || !onSelect}
            onClick={() => onSelect?.(i)}
            className={cn(
              "choice-press flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left text-[15px] transition-[border-color,background-color,transform] duration-150 disabled:cursor-default sm:px-4 sm:text-base",
              isRight
                ? "border-success bg-success-soft"
                : isWrong
                  ? "border-danger bg-danger-soft"
                  : isSelected
                    ? "border-accent bg-accent-soft"
                    : "border-border enabled:hover:border-accent/50 enabled:hover:bg-surface-2/50",
              reveal && !isRight && !isWrong && "opacity-60",
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-colors",
                isRight
                  ? "border-success bg-success text-white"
                  : isWrong
                    ? "border-danger bg-danger text-white"
                    : isSelected
                      ? "border-accent bg-accent text-white"
                      : "border-border text-muted",
              )}
            >
              {isRight ? <Icon name="check" className="size-3.5" strokeWidth={3} /> : isWrong ? <Icon name="x" className="size-3.5" strokeWidth={3} /> : LETTERS[i]}
            </span>
            <span className="min-w-0 flex-1 leading-snug">{choice}</span>
          </button>
        );
      })}
    </div>
  );
}

function SprInput({
  question,
  value,
  onChange,
  reveal,
  correct,
}: {
  question: SprQuestion;
  value: AnswerValue;
  onChange?: (answer: AnswerValue) => void;
  reveal: boolean;
  correct: boolean;
}) {
  const { t } = useI18n();
  const text = value === null ? "" : String(value);
  return (
    <div className="mt-6 space-y-3">
      <label className="block">
        <span className="text-sm font-medium">{t.spr.label}</span>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          maxLength={7}
          value={text}
          disabled={reveal || !onChange}
          onChange={(e) => onChange?.(e.target.value.replace(/[^0-9./\-−,]/g, "") || null)}
          placeholder="1/2, 0.5, 12"
          className={cn(
            "mt-2 h-14 w-full max-w-xs rounded-2xl border-2 bg-bg px-4 font-mono text-xl tracking-wide outline-none transition focus:border-accent disabled:cursor-default",
            reveal ? (correct ? "border-success bg-success-soft" : "border-danger bg-danger-soft") : "border-border",
          )}
        />
      </label>
      {reveal ? (
        <p className="text-sm">
          <span className="text-muted">{t.runner.correctAnswer}: </span>
          <strong className="font-mono">{correctAnswerText(question)}</strong>
        </p>
      ) : (
        <p className="text-xs text-muted">{t.spr.hint}</p>
      )}
    </div>
  );
}
