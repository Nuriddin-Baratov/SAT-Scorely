import { addDays, parseISODate, toISODate } from "@/shared/lib";
import type { IconName } from "@/shared/ui/icon";

import type { BadgeId, GameEvent, GameState } from "./types";

// ---------------- XP ----------------

export function xpFor(event: GameEvent): number {
  switch (event.type) {
    case "test":
      return 20 + event.correct * 10 + (event.correct === event.total && event.total > 0 ? 30 : 0);
    case "daily":
      return event.correct ? 25 : 10;
    case "practice":
      return event.correct ? 5 : 1;
    case "review":
      return (event.correct ? 8 : 2) + (event.mastered ? 15 : 0);
    case "word":
      return 2;
    case "listening":
      return event.correct * 5 + (event.correct === event.total && event.total > 0 ? 10 : 0);
  }
}

// ---------------- Darajalar ----------------

/** Har bir daraja boshlanadigan XP */
export const LEVEL_THRESHOLDS = [0, 150, 400, 800, 1500, 2500, 4000];

export function levelOf(xp: number) {
  let index = 0;
  LEVEL_THRESHOLDS.forEach((min, i) => {
    if (xp >= min) index = i;
  });
  const current = LEVEL_THRESHOLDS[index];
  const next = LEVEL_THRESHOLDS[index + 1];
  return {
    index,
    current,
    next: next ?? null,
    /** Keyingi darajagacha progress (0–1) */
    progress: next ? (xp - current) / (next - current) : 1,
  };
}

// ---------------- Seriya (streak) ----------------

/** Bugun yoki kecha tugagan uzluksiz faol kunlar soni */
export function currentStreak(activeDays: string[], today: string) {
  const set = new Set(activeDays);
  let cursor = parseISODate(today);
  if (!set.has(today)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (set.has(toISODate(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function bestStreak(activeDays: string[]) {
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of activeDays) {
    run = prev && toISODate(addDays(parseISODate(prev), 1)) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

// ---------------- Nishonlar ----------------

export interface BadgeDef {
  id: BadgeId;
  icon: IconName;
  tone: "accent" | "gold" | "success" | "warning";
  check: (state: GameState, streak: number) => boolean;
}

export const badgeDefs: BadgeDef[] = [
  { id: "first-test", icon: "pencil", tone: "accent", check: (s) => s.counters.tests >= 1 },
  { id: "perfect", icon: "trophy", tone: "gold", check: (s) => s.counters.perfectTests >= 1 },
  { id: "streak-3", icon: "flame", tone: "warning", check: (_, streak) => streak >= 3 },
  { id: "streak-7", icon: "flame", tone: "warning", check: (_, streak) => streak >= 7 },
  { id: "streak-30", icon: "flame", tone: "gold", check: (_, streak) => streak >= 30 },
  { id: "daily-5", icon: "calendar", tone: "accent", check: (s) => s.counters.daily >= 5 },
  { id: "mistakes-10", icon: "refresh", tone: "success", check: (s) => s.counters.mastered >= 10 },
  { id: "words-50", icon: "cards", tone: "accent", check: (s) => s.counters.words >= 50 },
  { id: "hard-module", icon: "bolt", tone: "gold", check: (s) => s.counters.hardModules >= 1 },
  { id: "night-owl", icon: "moon", tone: "accent", check: (s) => s.counters.nightOwl >= 1 },
  { id: "xp-1000", icon: "star", tone: "gold", check: (s) => s.xp >= 1000 },
  { id: "explorer", icon: "compass", tone: "success", check: (s) => s.counters.practice >= 25 },
];

// ---------------- Reducer ----------------

export const initialGameState: GameState = {
  xp: 0,
  activeDays: [],
  badges: {},
  unseen: [],
  counters: { tests: 0, perfectTests: 0, daily: 0, practice: 0, mastered: 0, words: 0, hardModules: 0, nightOwl: 0 },
  daily: {},
};

/** Hodisani qo'llaydi va yangi holat + ochilgan nishonlarni qaytaradi (sof funksiya). */
export function applyEvent(prev: GameState, event: GameEvent, now: Date, gained = xpFor(event)) {
  const today = toISODate(now);
  const counters = { ...initialGameState.counters, ...prev.counters };

  switch (event.type) {
    case "test":
      counters.tests++;
      if (event.total > 0 && event.correct === event.total) counters.perfectTests++;
      if (event.hardModule) counters.hardModules++;
      break;
    case "daily":
      counters.daily++;
      break;
    case "practice":
      counters.practice++;
      break;
    case "review":
      if (event.mastered) counters.mastered++;
      break;
    case "word":
      counters.words++;
      break;
  }
  if (now.getHours() < 5) counters.nightOwl++;

  const activeDays = prev.activeDays.includes(today) ? prev.activeDays : [...prev.activeDays, today].sort();
  // Faollik xaritasi: testda — savollar soni, qolgan hodisalarda — 1
  const units = event.type === "test" || event.type === "listening" ? Math.max(1, event.total) : 1;
  const activity = { ...prev.activity, [today]: (prev.activity?.[today] ?? 0) + units };

  const next: GameState = {
    ...prev,
    activity,
    xp: prev.xp + gained,
    activeDays,
    counters,
    daily: event.type === "daily" ? { ...prev.daily, [event.date]: { questionId: event.questionId, choice: event.choice, correct: event.correct } } : prev.daily,
  };

  const streak = currentStreak(activeDays, today);
  const unlocked = badgeDefs.filter((b) => !next.badges[b.id] && b.check(next, streak)).map((b) => b.id);
  if (unlocked.length) {
    next.badges = { ...next.badges, ...Object.fromEntries(unlocked.map((id) => [id, now.toISOString()])) };
    next.unseen = [...next.unseen, ...unlocked];
  }

  return { state: next, gained, unlocked, levelUp: levelOf(next.xp).index > levelOf(prev.xp).index };
}
