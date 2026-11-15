"use client";

import { useState } from "react";

import { gameRepository } from "@/entities/gamification";
import { useVocabProgress, vocabRepository, vocabWords, type VocabWord, type WordStatus } from "@/entities/vocab";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Card, ProgressBar } from "@/shared/ui/primitives";

type Filter = "new" | "learning" | "known" | "all";

export function Flashcards() {
  const { t, locale } = useI18n();
  const progress = useVocabProgress();
  const [filter, setFilter] = useState<Filter>("new");
  const [deck, setDeck] = useState<VocabWord[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (progress === undefined) return <div className="h-96 animate-pulse rounded-3xl bg-surface-2" />;

  const statusOf = (w: VocabWord): WordStatus | "new" => progress[w.word] ?? "new";
  const counts = {
    all: vocabWords.length,
    new: vocabWords.filter((w) => statusOf(w) === "new").length,
    learning: vocabWords.filter((w) => statusOf(w) === "learning").length,
    known: vocabWords.filter((w) => statusOf(w) === "known").length,
  };
  const list = vocabWords.filter((w) => filter === "all" || statusOf(w) === filter);

  function answer(status: WordStatus) {
    if (!deck) return;
    const word = deck[index];
    if (vocabRepository.mark(word.word, status)) gameRepository.track({ type: "word" });
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  // ---------- Kartochka rejimi ----------
  if (deck) {
    const word = deck[index];
    if (!word) {
      return (
        <Card className="mx-auto max-w-xl p-10 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success-soft text-success">
            <Icon name="check" className="size-7" />
          </span>
          <h2 className="mt-6 text-2xl font-bold">{t.vocab.deckDone}</h2>
          <p className="mt-2 text-muted">{t.vocab.knownCount(counts.known, counts.all)}</p>
          <Button className="mt-8" onClick={() => setDeck(null)}>
            {t.practice.backToList}
          </Button>
        </Card>
      );
    }

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

        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={t.vocab.flip}
          className="group block w-full [perspective:1200px]"
        >
          <div
            className={cn(
              "relative h-80 w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none",
              flipped && "[transform:rotateY(180deg)]",
            )}
          >
            <div className="noise absolute inset-0 grid place-items-center overflow-hidden rounded-[1.75rem] bg-ink p-8 text-white shadow-lift [backface-visibility:hidden]">
              <div className="aurora opacity-50" aria-hidden>
                <span />
                <span />
                <span />
              </div>
              <div className="relative text-center">
                <p className="text-xs font-semibold tracking-[0.2em] text-white/50 uppercase">{t.vocab.pos[word.pos]}</p>
                <p lang="en" className="mt-3 font-display text-5xl font-bold">{word.word}</p>
                <p className="mt-6 text-sm text-white/50">{t.vocab.tapToFlip}</p>
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col justify-center rounded-[1.75rem] border border-border bg-surface p-8 text-left shadow-lift [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p lang="en" className="font-display text-2xl font-bold">{word.word}</p>
              <p lang="en" className="mt-2 text-muted">{word.definition}</p>
              <p className="mt-4 text-lg font-semibold text-accent">{word.translation[locale]}</p>
              <p lang="en" className="mt-4 rounded-xl bg-surface-2/70 p-3 text-sm italic">“{word.example}”</p>
            </div>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" onClick={() => answer("learning")}>
            <Icon name="refresh" className="size-4" /> {t.vocab.again}
          </Button>
          <Button size="lg" onClick={() => answer("known")}>
            <Icon name="check" className="size-4" /> {t.vocab.know}
          </Button>
        </div>
      </div>
    );
  }

  // ---------- Ro'yxat ----------
  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold">{t.vocab.knownCount(counts.known, counts.all)}</p>
          <ProgressBar value={(counts.known / counts.all) * 100} tone="success" className="mt-3" label={t.vocab.title} />
        </div>
        <Button
          size="lg"
          disabled={!list.length}
          onClick={() => {
            setIndex(0);
            setFlipped(false);
            setDeck([...list].sort(() => Math.random() - 0.5).slice(0, 15));
          }}
        >
          <Icon name="cards" className="size-4.5" /> {t.vocab.startDeck}
        </Button>
      </Card>

      <div className="flex flex-wrap gap-2" role="tablist">
        {(["new", "learning", "known", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              filter === f ? "bg-fg text-bg" : "bg-surface-2 text-muted hover:text-fg",
            )}
          >
            {t.vocab.filters[f]} <span className="ml-1 opacity-60 tabular-nums">{counts[f]}</span>
          </button>
        ))}
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((w) => {
          const status = statusOf(w);
          return (
            <li key={w.word} className="rounded-2xl border border-border bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <p lang="en" className="font-display text-lg font-bold">{w.word}</p>
                <span
                  className={cn(
                    "mt-1.5 size-2.5 shrink-0 rounded-full",
                    status === "known" ? "bg-success" : status === "learning" ? "bg-warning" : "bg-border",
                  )}
                  title={t.vocab.filters[status]}
                />
              </div>
              <p className="mt-1 text-sm text-accent">{w.translation[locale]}</p>
              <p lang="en" className="mt-1 line-clamp-2 text-xs text-muted">{w.definition}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
