import type { Locale } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { planTexts } from "../model/texts";
import type { Difficulty, SessionKind } from "../model/types";

/** Mashg'ulot turi nomlari tanlangan tilda */
export function sessionKindLabels(locale: Locale): Record<SessionKind, string> {
  return planTexts(locale).kinds;
}

export function difficultyLabels(locale: Locale): Record<Difficulty, string> {
  return planTexts(locale).difficulty;
}

const tone: Record<SessionKind, string> = {
  diagnostic: "bg-gold-soft text-gold",
  lesson: "bg-accent-soft text-accent",
  "module-test": "bg-warning-soft text-warning",
  "practice-test": "bg-gold-soft text-gold",
  review: "bg-surface-2 text-muted",
  "test-prep": "bg-success-soft text-success",
};

const paths: Record<SessionKind, string> = {
  diagnostic: "M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3",
  lesson: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM8 7h7M8 11h5",
  "module-test": "M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "practice-test": "M9 11l2 2 4-4M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z",
  review: "M4 4v6h6M20 20v-6h-6M5.5 15A7.5 7.5 0 0018 18M18.5 9A7.5 7.5 0 006 6",
  "test-prep": "M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3z",
};

export function SessionKindIcon({ kind, className }: { kind: SessionKind; className?: string }) {
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", tone[kind], className)}>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path d={paths[kind]} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
