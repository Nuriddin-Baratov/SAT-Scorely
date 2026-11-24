"use client";

import { useState } from "react";

import { gameRepository } from "@/entities/gamification";
import { useVocabProgress, vocabRepository, vocabWords, type VocabWord, type WordStatus } from "@/entities/vocab";
import { useI18n, type Locale } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Card, ProgressBar } from "@/shared/ui/primitives";

type Filter = "new" | "learning" | "known" | "all";
interface QuizItem {
  word: VocabWord;
  /** 4 ta variant (biri — to'g'ri javob), aralashtirilgan */
  options: VocabWord[];
}

const shuffle = <T,>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

/** To'g'ri javob + 3 ta chalg'ituvchi (iloji boricha shu so'z turkumidan, tarjimasi takrorlanmaydigan). */
function buildQuiz(words: VocabWord[], locale: Locale, size = 15): QuizItem[] {
  return shuffle(words)
    .slice(0, size)
    .map((word) => {
      const seen = new Set([word.translation[locale]]);
      const pool = [
        ...shuffle(vocabWords.filter((w) => w.pos === word.pos)),
        ...shuffle(vocabWords.filter((w) => w.pos !== word.pos)),
      ];
      const distractors: VocabWord[] = [];
      for (const w of pool) {
        if (distractors.length === 3) break;
        if (seen.has(w.translation[locale])) continue;
        seen.add(w.translation[locale]);
        distractors.push(w);
      }
      return { word, options: shuffle([word, ...distractors]) };
    });
}

export function Flashcards() {
  const { t, locale } = useI18n();
  const progress = useVocabProgress();
  const [filter, setFilter] = useState<Filter>("new");
  // Ro'yxat 20 tadan; filtr almashsa — yana boshidan
  const [more, setMore] = useState({ key: "new" as Filter, n: 20 });
  const shown = more.key === filter ? more.n : 20;
  const [deck, setDeck] = useState<QuizItem[] | null>(null);
  const [index, setIndex] = useState(0);
  /** Tanlangan variant (so'z) — javob berilgandan keyin */
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  if (progress === undefined) return <div className="h-96 animate-pulse rounded-3xl bg-surface-2" />;

  const statusOf = (w: VocabWord): WordStatus | "new" => progress[w.word] ?? "new";
  const counts = {
    all: vocabWords.length,
    new: vocabWords.filter((w) => statusOf(w) === "new").length,
    learning: vocabWords.filter((w) => statusOf(w) === "learning").length,
    known: vocabWords.filter((w) => statusOf(w) === "known").length,
  };
  const list = vocabWords.filter((w) => filter === "all" || statusOf(w) === filter);

  function choose(option: VocabWord) {
    if (!deck || picked) return;
    const { word } = deck[index];
    const correct = option.word === word.word;
    setPicked(option.word);
    if (correct) setScore((s) => s + 1);
    // To'g'ri — o'rganilgan; xato — qayta takrorlash ro'yxatiga
    const status: WordStatus = correct ? "known" : "learning";
    if (vocabRepository.mark(word.word, status)) gameRepository.track({ type: "word" }, { type: "word", word: word.word, choice: option.word });
  }

  function next() {
    setPicked(null);
    setIndex((i) => i + 1);
  }

  // ---------- Test rejimi ----------
  if (deck) {
    const item = deck[index];
    if (!item) {
      return (
        <Card className="mx-auto max-w-xl p-10 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success-soft text-success">
            <Icon name="check" className="size-7" />
          </span>
          <h2 className="mt-6 text-2xl font-bold">{t.vocab.deckDone}</h2>
          <p className="mt-2 text-lg font-semibold">{t.vocab.score(score, deck.length)}</p>
          <p className="mt-1 text-muted">{t.vocab.knownCount(counts.known, counts.all)}</p>
          <div className="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => setDeck(null)}>
              {t.practice.backToList}
            </Button>
            {/* Xuddi shu so'zlar — yangi tartib va yangi variantlar bilan */}
            <Button
              onClick={() => {
                setDeck(buildQuiz(deck.map((d) => d.word), locale));
                setIndex(0);
                setPicked(null);
                setScore(0);
              }}
              autoFocus
            >
              <Icon name="refresh" className="size-4" /> {t.vocab.tryAgain}
            </Button>
          </div>
        </Card>
      );
    }

    const { word } = item;

    return (
      <div className="mx-auto max-w-xl space-y-5">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setDeck(null)} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
            <Icon name="arrowLeft" className="size-4" /> {t.practice.backToList}
          </button>
          <ProgressBar value={(index / deck.length) * 100} className="flex-1" label={t.vocab.title} />
          <span className="text-sm font-semibold text-muted tabular-nums">
            {index + 1}/{deck.length}
          </span>
        </div>

        {/* Savol: inglizcha so'z */}
        <div key={word.word} className="noise relative grid h-56 place-items-center overflow-hidden rounded-[1.75rem] bg-ink p-8 text-white shadow-lift animate-fade-up">
          <div className="aurora opacity-50" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="relative text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-white/50 uppercase">{t.vocab.pos[word.pos]}</p>
            <p lang="en" className="mt-3 font-display text-4xl font-bold sm:text-5xl">{word.word}</p>
            <p className="mt-5 text-sm text-white/60">{t.vocab.prompt}</p>
          </div>
        </div>

        {/* 4 ta variant */}
        <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label={t.vocab.prompt}>
          {item.options.map((option, i) => {
            const isAnswer = option.word === word.word;
            const isPicked = option.word === picked;
            return (
              <button
                key={option.word}
                type="button"
                disabled={!!picked}
                onClick={() => choose(option)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 text-left font-medium transition",
                  !picked && "border-border bg-surface hover:border-accent hover:bg-accent-soft",
                  picked && isAnswer && "border-success bg-success-soft text-success",
                  picked && isPicked && !isAnswer && "border-danger bg-danger-soft text-danger",
                  picked && !isAnswer && !isPicked && "border-border bg-surface opacity-50",
                )}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold text-muted">
                  {picked && (isAnswer || isPicked) ? (
                    <Icon name={isAnswer ? "check" : "x"} className="size-4" />
                  ) : (
                    "ABCD"[i]
                  )}
                </span>
                {option.translation[locale]}
              </button>
            );
          })}
        </div>

        {/* Javobdan keyin: natija, ta'rif va misol */}
        {picked && (
          <Card className="animate-fade-up space-y-3 p-5">
            <p className={cn("font-semibold", picked === word.word ? "text-success" : "text-danger")}>
              {picked === word.word ? t.vocab.correct : t.vocab.wrong} —{" "}
              <span lang="en" className="text-fg">{word.word}</span>: {word.translation[locale]}
            </p>
            <p lang="en" className="text-sm text-muted">{word.definition}</p>
            <p lang="en" className="rounded-xl bg-surface-2/70 p-3 text-sm italic">“{word.example}”</p>
            <Button size="lg" className="w-full" onClick={next} autoFocus>
              {t.common.next} <Icon name="arrowRight" className="size-4" />
            </Button>
          </Card>
        )}
      </div>
    );
  }

  // ---------- Ro'yxat ----------
  return (
    <div className="space-y-3 sm:space-y-6">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-6">
        <div className="flex-1">
          <p className="text-sm font-semibold">{t.vocab.knownCount(counts.known, counts.all)}</p>
          <ProgressBar value={(counts.known / counts.all) * 100} tone="success" className="mt-3" label={t.vocab.title} />
        </div>
        {/* Filtrda so'z qolmagan bo'lsa (masalan, hammasi o'rganilgan) — barcha so'zlar bilan qayta urinish */}
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => {
            setIndex(0);
            setPicked(null);
            setScore(0);
            setDeck(buildQuiz(list.length ? list : vocabWords, locale));
          }}
        >
          <Icon name={list.length ? "cards" : "refresh"} className="size-4.5" />{" "}
          {list.length ? t.vocab.startDeck : t.vocab.tryAgain}
        </Button>
      </Card>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" role="tablist">
        {(["new", "learning", "known", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition",
              filter === f ? "bg-fg text-bg" : "bg-surface-2 text-muted hover:text-fg",
            )}
          >
            {t.vocab.filters[f]} <span className="ml-1 opacity-60 tabular-nums">{counts[f]}</span>
          </button>
        ))}
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-card sm:grid sm:grid-cols-2 sm:divide-y-0 sm:gap-px sm:bg-border lg:grid-cols-3">
        {list.slice(0, shown).map((w) => {
          const status = statusOf(w);
          return (
            <li key={w.word} className="flex items-center gap-3 bg-surface px-4 py-2.5 sm:block sm:p-4">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full sm:hidden",
                  status === "known" ? "bg-success" : status === "learning" ? "bg-warning" : "bg-border",
                )}
                title={t.vocab.filters[status]}
              />
              <div className="flex min-w-0 flex-1 items-baseline gap-2 sm:block">
                <div className="flex items-start justify-between gap-2">
                  <p lang="en" className="font-display font-bold sm:text-lg">{w.word}</p>
                  <span
                    className={cn(
                      "mt-1.5 hidden size-2.5 shrink-0 rounded-full sm:block",
                      status === "known" ? "bg-success" : status === "learning" ? "bg-warning" : "bg-border",
                    )}
                    title={t.vocab.filters[status]}
                  />
                </div>
                <p className="min-w-0 truncate text-sm text-accent sm:mt-1">{w.translation[locale]}</p>
                <p lang="en" className="mt-1 hidden line-clamp-2 text-xs text-muted sm:block">{w.definition}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {list.length > shown && (
        <Button variant="outline" className="w-full" onClick={() => setMore({ key: filter, n: shown + 20 })}>
          {t.results.showAll} ({list.length - shown})
        </Button>
      )}
    </div>
  );
}
