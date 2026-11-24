"use client";

import Link from "next/link";
import { useState } from "react";

import { gameRepository } from "@/entities/gamification";
import { MAX_BOX, REVIEW_INTERVALS, dueMistakes, mistakesRepository, useMistakes } from "@/entities/mistake";
import { QuestionDrill, getQuestion, type Question } from "@/entities/practice-test";
import { routes } from "@/shared/config";
import { localeTags, useI18n } from "@/shared/i18n";
import { cn, parseISODate } from "@/shared/lib";
import { useToday } from "@/shared/lib/react";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card, IconTile } from "@/shared/ui/primitives";

export function MistakesReview() {
  const { t, locale, href } = useI18n();
  const today = useToday();
  const mistakes = useMistakes();
  const [session, setSession] = useState<Question[] | null>(null);
  const [masteredNow, setMasteredNow] = useState(0);

  if (!today || mistakes === undefined) {
    return <div className="h-80 animate-pulse rounded-3xl bg-surface-2" />;
  }

  const all = Object.values(mistakes).sort((a, b) => a.due.localeCompare(b.due));
  const due = dueMistakes(mistakes, today);
  const toQuestions = (ids: string[]) => ids.map(getQuestion).filter((q): q is Question => !!q);
  const dateFormat = new Intl.DateTimeFormat(localeTags[locale], { day: "numeric", month: "short" });

  if (session) {
    return (
      <QuestionDrill
        questions={session}
        onExit={() => setSession(null)}
        onAnswer={(q, correct, answer) => {
          const box = mistakesRepository.get()[q.id]?.box ?? 0;
          const { mastered } = mistakesRepository.review(q.id, correct);
          const game = gameRepository.track({ type: "review", correct, mastered }, { type: "review", questionId: q.id, answer, mastered });
          if (mastered) setMasteredNow((n) => n + 1);
          return (
            <span className="inline-flex items-center gap-1.5">
              <span className="font-semibold text-gold">+{game.gained} XP</span>·
              {mastered ? t.mistakes.masteredNote : correct ? t.mistakes.nextIn(REVIEW_INTERVALS[Math.min(box, MAX_BOX - 1)]) : t.mistakes.tomorrow}
            </span>
          );
        }}
        doneExtra={masteredNow > 0 && <p className="mt-3 font-semibold text-success">{t.mistakes.masteredCount(masteredNow)}</p>}
      />
    );
  }

  if (all.length === 0) {
    return (
      <Card className="flex flex-col items-center px-6 py-16 text-center">
        <IconTile tone="success" className="size-16 rounded-[1.25rem]">
          <Icon name="check" className="size-7" />
        </IconTile>
        <h2 className="mt-6 text-2xl font-bold">{t.mistakes.emptyTitle}</h2>
        <p className="mt-2 max-w-md text-muted">{t.mistakes.emptyText}</p>
        <ButtonLink href={href(routes.tests)} className="mt-8">
          {t.nav.tests} <Icon name="arrowRight" className="size-4" />
        </ButtonLink>
      </Card>
    );
  }

  const boxes = Array.from({ length: MAX_BOX + 1 }, (_, b) => all.filter((m) => m.box === b).length);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <Card className="noise relative overflow-hidden bg-ink p-7 text-white">
          <div className="aurora opacity-50" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="relative">
            <p className="text-sm text-white/60">{t.mistakes.dueToday}</p>
            <p className="mt-1 font-display text-6xl font-bold tabular-nums">{due.length}</p>
            <p className="mt-2 text-sm text-white/60">{t.mistakes.totalInNotebook(all.length)}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="secondary"
                className="bg-white text-ink hover:opacity-100 hover:brightness-95"
                disabled={due.length === 0}
                onClick={() => {
                  setMasteredNow(0);
                  setSession(toQuestions(due.map((m) => m.questionId)));
                }}
              >
                <Icon name="play" className="size-4" /> {t.mistakes.startDue}
              </Button>
              <Button
                variant="ghost"
                className="glass text-white hover:bg-white/10"
                onClick={() => {
                  setMasteredNow(0);
                  setSession(toQuestions(all.map((m) => m.questionId)));
                }}
              >
                {t.mistakes.reviewAll}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold">{t.mistakes.howTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t.mistakes.howText}</p>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {boxes.map((count, b) => (
              <div key={b} className="rounded-2xl bg-surface-2/70 p-3 text-center">
                <p className="font-display text-2xl font-bold tabular-nums">{count}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted">{b === 0 ? t.mistakes.boxNew : t.mistakes.boxDays(REVIEW_INTERVALS[b - 1])}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <h2 className="px-6 pt-5 pb-3 text-lg font-bold">{t.mistakes.listTitle}</h2>
        <ul className="divide-y divide-border">
          {all.map((m) => {
            const q = getQuestion(m.questionId);
            if (!q) return null;
            const isDue = m.due <= today;
            return (
              <li key={m.questionId} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p lang="en" className="truncate text-sm font-medium">
                    {q.prompt.split("\n")[0]}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge tone={q.sectionId === "rw" ? "accent" : "gold"}>{t.domains[q.domainId]}</Badge>
                    <Badge tone="danger">× {m.wrongCount}</Badge>
                  </div>
                </div>
                <span className={cn("text-xs font-semibold whitespace-nowrap", isDue ? "text-warning" : "text-muted")}>
                  {isDue ? t.mistakes.dueNow : `${t.mistakes.dueOn} ${dateFormat.format(parseISODate(m.due))}`}
                </span>
                <button
                  type="button"
                  onClick={() => mistakesRepository.remove(m.questionId)}
                  aria-label={t.mistakes.remove}
                  title={t.mistakes.remove}
                  className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-danger"
                >
                  <Icon name="trash" className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <p className="text-center text-sm text-muted">
        <Link prefetch href={href(routes.practice)} className="font-medium text-accent hover:underline">
          {t.nav.practice}
        </Link>{" "}
        — {t.mistakes.practiceHint}
      </p>
    </div>
  );
}
