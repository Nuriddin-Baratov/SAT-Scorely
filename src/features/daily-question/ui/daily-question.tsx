"use client";

import { useState } from "react";

import { gameRepository, useGameState } from "@/entities/gamification";
import { mistakesRepository } from "@/entities/mistake";
import { QuestionCard, dailyQuestionFor, getQuestion, isAnswered, isCorrect, type AnswerValue } from "@/entities/practice-test";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { useToday } from "@/shared/lib/react";
import { Button } from "@/shared/ui/button";
import { launchConfetti } from "@/shared/ui/confetti";
import { Icon } from "@/shared/ui/icon";

/** Kunlik savol: kuniga bitta, javobdan keyin tushuntirish va XP. */
export function DailyQuestion({ className }: { className?: string }) {
  const { t } = useI18n();
  const today = useToday();
  const game = useGameState();
  const [choice, setChoice] = useState<AnswerValue>(null);
  const [gained, setGained] = useState<number | null>(null);

  if (!today || !game) {
    return <div className={cn("h-96 animate-pulse rounded-3xl bg-surface-2", className)} />;
  }

  const record = game.daily[today];
  const question = (record && getQuestion(record.questionId)) || dailyQuestionFor(today);
  const answered = !!record;
  const selected = record?.choice ?? choice;

  function submit() {
    if (choice === null || !isAnswered(choice) || !today) return;
    const correct = isCorrect(question, choice);
    if (!correct) mistakesRepository.addWrong([question.id]);
    const result = gameRepository.track({ type: "daily", date: today, questionId: question.id, choice, correct });
    setGained(result.gained);
    if (correct) launchConfetti({ particles: 80, duration: 1800 });
  }

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gold-soft text-gold ring-1 ring-gold/20 ring-inset">
            <Icon name="calendar" />
          </span>
          <div>
            <h2 className="text-xl font-bold">{t.daily.title}</h2>
            <p className="text-sm text-muted">{t.daily.subtitle}</p>
          </div>
        </div>
        {answered && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-sm font-semibold text-success">
            <Icon name="check" className="size-4" /> {t.daily.done}
            {gained !== null && <span className="text-gold">· +{gained} XP</span>}
          </span>
        )}
      </div>

      <QuestionCard
        question={question}
        selected={selected}
        onSelect={answered ? undefined : setChoice}
        reveal={answered}
      />

      {!answered ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">{t.daily.reward}</p>
          <Button onClick={submit} disabled={!isAnswered(choice)}>
            {t.daily.check} <Icon name="arrowRight" className="size-4" />
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-muted">{t.daily.comeBack}</p>
      )}
    </div>
  );
}
