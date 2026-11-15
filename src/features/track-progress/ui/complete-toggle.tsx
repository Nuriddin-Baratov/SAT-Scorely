"use client";

import { progressRepository } from "@/entities/study-plan";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";

export function CompleteCheckbox({ sessionId, done, label }: { sessionId: string; done: boolean; label: string }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={`${label} — ${done ? t.dashboard.completed : t.dashboard.notCompleted}`}
      onClick={(event) => {
        event.stopPropagation();
        progressRepository.toggle(sessionId);
      }}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full border-2 transition",
        done ? "border-success bg-success text-white" : "border-border hover:border-success",
      )}
    >
      {done && (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export function CompleteButton({ sessionId, done }: { sessionId: string; done: boolean }) {
  const { t } = useI18n();
  return (
    <Button variant={done ? "outline" : "primary"} onClick={() => progressRepository.toggle(sessionId)}>
      {done ? t.dashboard.markUndone : t.dashboard.markDone}
    </Button>
  );
}
