"use client";

import { useMemo, useState } from "react";

import { gameRepository } from "@/entities/gamification";
import { mistakesRepository } from "@/entities/mistake";
import { QuestionDrill, questions, type Question } from "@/entities/practice-test";
import { domains, type DomainId, type SectionId } from "@/entities/sat";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card } from "@/shared/ui/primitives";

type Difficulty = Question["difficulty"];

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const PAGE = 12;

export function QuestionBank() {
  const { t } = useI18n();
  const [section, setSection] = useState<SectionId | "all">("all");
  const [domain, setDomain] = useState<DomainId | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [session, setSession] = useState<Question[] | null>(null);
  // Ro'yxat 12 tadan ko'rsatiladi; filtr o'zgarsa — yana boshidan
  const filterKey = `${section}|${domain}|${difficulty}`;
  const [more, setMore] = useState({ key: filterKey, n: PAGE });
  const limit = more.key === filterKey ? more.n : PAGE;
  const setLimit = (next: (n: number) => number) => setMore({ key: filterKey, n: next(limit) });

  const filtered = useMemo(
    () =>
      questions.filter(
        (q) =>
          (section === "all" || q.sectionId === section) &&
          (domain === "all" || q.domainId === domain) &&
          (difficulty === "all" || q.difficulty === difficulty),
      ),
    [section, domain, difficulty],
  );

  if (session) {
    return (
      <QuestionDrill
        questions={session}
        onExit={() => setSession(null)}
        onAnswer={(q, correct) => {
          if (!correct) mistakesRepository.addWrong([q.id]);
          const game = gameRepository.track({ type: "practice", correct });
          return (
            <span>
              <span className="font-semibold text-gold">+{game.gained} XP</span>
              {!correct && ` · ${t.practice.addedToMistakes}`}
            </span>
          );
        }}
      />
    );
  }

  const domainOptions = domains.filter((d) => section === "all" || d.sectionId === section);

  return (
    <div className="space-y-3 sm:space-y-6">
      <Card className="space-y-3 p-3.5 sm:space-y-5 sm:p-6">
        <FilterRow label={t.practice.section}>
          {(["all", "rw", "math"] as const).map((s) => (
            <Chip
              key={s}
              active={section === s}
              onClick={() => {
                setSection(s);
                setDomain("all");
              }}
            >
              {s === "all" ? t.practice.all : t.sections[s]}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label={t.practice.topic}>
          <Chip active={domain === "all"} onClick={() => setDomain("all")}>
            {t.practice.all}
          </Chip>
          {domainOptions.map((d) => (
            <Chip key={d.id} active={domain === d.id} onClick={() => setDomain(d.id)}>
              {t.domains[d.id]}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label={t.practice.difficulty}>
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
              {d === "all" ? t.practice.all : t.levels[d]}
            </Chip>
          ))}
        </FilterRow>

        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-border pt-3 sm:gap-3 sm:pt-5">
          <p className="text-sm text-muted">{t.practice.found(filtered.length)}</p>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Button variant="outline" disabled={!filtered.length} onClick={() => setSession(shuffle(filtered).slice(0, 10))}>
              <Icon name="bolt" className="size-4" /> {t.practice.random10}
            </Button>
            <Button disabled={!filtered.length} onClick={() => setSession(filtered)}>
              <Icon name="play" className="size-4" /> {t.practice.startAll}
            </Button>
          </div>
        </div>
      </Card>

      <ul className="grid gap-2 sm:gap-3 md:grid-cols-2">
        {filtered.slice(0, limit).map((q) => (
          <li key={q.id}>
            <button
              type="button"
              onClick={() => setSession([q])}
              className="group flex h-full w-full flex-col rounded-2xl border border-border bg-surface p-3.5 text-left shadow-card transition active:scale-[0.99] sm:p-5 sm:hover:-translate-y-0.5 sm:hover:shadow-lift"
            >
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={q.sectionId === "rw" ? "accent" : "gold"}>{t.domains[q.domainId]}</Badge>
                <Badge tone={q.difficulty === "hard" ? "danger" : q.difficulty === "medium" ? "warning" : "success"}>
                  {t.levels[q.difficulty]}
                </Badge>
              </div>
              <p lang="en" className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed sm:mt-3 sm:line-clamp-3">
                {q.passage ?? q.prompt.split("\n")[0]}
              </p>
              <span className="mt-4 hidden items-center gap-1.5 text-sm font-semibold text-accent sm:inline-flex">
                {t.practice.solve} <Icon name="arrowRight" className="size-4 transition group-hover:translate-x-1" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {filtered.length > limit && (
        <Button variant="outline" className="w-full" onClick={() => setLimit((n) => n + PAGE)}>
          {t.results.showAll} ({filtered.length - limit})
        </Button>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-2">
      <p className="w-28 shrink-0 text-[11px] font-semibold tracking-wide text-muted uppercase sm:pt-1.5 sm:text-xs">{label}</p>
      {/* Mobilda bir qator, yon tomonga suriladi */}
      <div className="-mx-3.5 flex gap-2 overflow-x-auto px-3.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition",
        active ? "bg-fg text-bg" : "bg-surface-2 text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
