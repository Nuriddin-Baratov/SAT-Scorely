import { createStorageStore } from "@/shared/lib/react";
import type { PlanSession, StudyPlan } from "./types";

const progressStore = createStorageStore<string[]>("scorely.progress.v1", []);

export const progressRepository = {
  toggle(sessionId: string) {
    const current = progressStore.get();
    progressStore.set(
      current.includes(sessionId) ? current.filter((id) => id !== sessionId) : [...current, sessionId],
    );
  },
  /** "Bajarildi" (takror chaqirish xavfsiz) */
  complete(sessionId: string) {
    const current = progressStore.get();
    if (!current.includes(sessionId)) progressStore.set([...current, sessionId]);
  },
  reset: () => progressStore.clear(),
};

export function useCompletedSessions(): string[] | undefined {
  return progressStore.useValue();
}

export function computeProgress(plan: StudyPlan, completed: string[]) {
  const done = new Set(completed);
  const doneSessions = plan.sessions.filter((s) => done.has(s.id));
  const doneMinutes = doneSessions.reduce((sum, s) => sum + s.minutes, 0);
  return {
    done: doneSessions.length,
    total: plan.sessions.length,
    percent: plan.sessions.length ? (doneSessions.length / plan.sessions.length) * 100 : 0,
    hoursDone: Math.round((doneMinutes / 60) * 10) / 10,
  };
}

/** Bajarilmagan eng yaqin sessiya: avval bugundan keyingilar, bo'lmasa o'tkazib yuborilgan birinchisi. */
export function findNextSession(plan: StudyPlan, completed: string[], today: string): PlanSession | null {
  const done = new Set(completed);
  const pending = plan.sessions.filter((s) => !done.has(s.id));
  return pending.find((s) => s.date >= today) ?? pending[0] ?? null;
}

export function currentWeekIndex(plan: StudyPlan, today: string): number {
  const week = plan.weeks.find((w) => today >= w.start && today <= w.end);
  if (week) return week.index;
  return today < plan.startDate ? 0 : plan.weeks.length - 1;
}
