"use client";

import { useState, type ReactNode } from "react";

import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Card, ProgressBar } from "@/shared/ui/primitives";

import { isAnswered, isCorrect } from "../model/answer";
import type { AnswerValue, Question } from "../model/types";
import { MathTools } from "./math-tools";
import { QuestionCard } from "./question-card";

/**
 * Savollarni birma-bir ishlash: tanlash → tekshirish → tushuntirish → keyingisi.
 * Har bir javob `onAnswer` orqali tashqariga beriladi (XP, xatolar daftari va h.k.).
 */
export function QuestionDrill({
  questions,
  onAnswer,
  onExit,
  doneExtra,
  exitLabel,
}: {
  questions: Question[];
  onAnswer: (question: Question, correct: boolean, answer: AnswerValue) => ReactNode | void;
  onExit: () => void;
  doneExtra?: ReactNode;
  /** Yakuniy tugma matni (standart — "Ro'yxatga qaytish") */
  exitLabel?: string;
}) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<AnswerValue>(null);
  const [checked, setChecked] = useState(false);
  const [note, setNote] = useState<ReactNode>(null);
  const [score, setScore] = useState(0);

  const done = index >= questions.length;
  const q = questions[index];

  if (done) {
    const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
    return (
      <Card className="mx-auto max-w-xl p-8 text-center sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success-soft text-success">
          <Icon name="trophy" className="size-7" />
        </span>
        <h2 className="mt-6 text-3xl font-bold">{t.practice.sessionDone}</h2>
        <p className="mt-2 text-muted">
          {t.runner.correct}: <strong className="text-fg">{score}</strong> / {questions.length} · {pct}%
        </p>
        {doneExtra}
        <Button className="mt-8" onClick={onExit}>
          {exitLabel ?? t.practice.backToList}
        </Button>
      </Card>
    );
  }

  function check() {
    if (!isAnswered(choice)) return;
    const correct = isCorrect(q, choice);
    if (correct) setScore((s) => s + 1);
    setNote(onAnswer(q, correct, choice) ?? null);
    setChecked(true);
  }

  function next() {
    setIndex((i) => i + 1);
    setChoice(null);
    setChecked(false);
    setNote(null);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onExit} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
          <Icon name="arrowLeft" className="size-4" /> {t.practice.backToList}
        </button>
        <ProgressBar value={(index / questions.length) * 100} className="flex-1" label={t.runner.question} />
        <span className="text-sm font-semibold text-muted tabular-nums">
          {index + 1}/{questions.length}
        </span>
      </div>

      <QuestionCard
        key={q.id}
        question={q}
        number={index + 1}
        selected={choice}
        onSelect={checked ? undefined : setChoice}
        reveal={checked}
      />

      {q.sectionId === "math" && <MathTools />}

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted">{note}</div>
        {checked ? (
          <Button onClick={next}>
            {index + 1 < questions.length ? t.runner.next : t.practice.finish} <Icon name="arrowRight" className="size-4" />
          </Button>
        ) : (
          <Button onClick={check} disabled={!isAnswered(choice)}>
            {t.daily.check}
          </Button>
        )}
      </div>
    </div>
  );
}
