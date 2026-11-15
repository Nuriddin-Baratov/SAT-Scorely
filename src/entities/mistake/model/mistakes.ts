"use client";

import { addDays, parseISODate, toISODate } from "@/shared/lib";
import { createStorageStore } from "@/shared/lib/react";

/**
 * Leitner tizimi: 0-quti — bugun, keyin 1, 3, 7 kundan so'ng takror.
 * Oxirgi qutida to'g'ri javob berilsa — savol “o'zlashtirilgan” deb o'chiriladi.
 */
export const REVIEW_INTERVALS = [1, 3, 7] as const;
export const MAX_BOX = REVIEW_INTERVALS.length;

export interface MistakeEntry {
  questionId: string;
  /** 0 … MAX_BOX */
  box: number;
  /** Keyingi takrorlash sanasi (`YYYY-MM-DD`) */
  due: string;
  wrongCount: number;
  addedAt: string;
}

type MistakeMap = Record<string, MistakeEntry>;

const store = createStorageStore<MistakeMap>("scorely.mistakes.v1", {});
const today = () => toISODate(new Date());
const plusDays = (days: number) => toISODate(addDays(parseISODate(today()), days));

export const mistakesRepository = {
  get: store.get,
  /** Noto'g'ri javoblarni daftarga qo'shadi (bugundan takrorlash mumkin). */
  addWrong(questionIds: string[]) {
    if (!questionIds.length) return;
    const next = { ...store.get() };
    for (const id of questionIds) {
      const prev = next[id];
      next[id] = {
        questionId: id,
        box: 0,
        due: today(),
        wrongCount: (prev?.wrongCount ?? 0) + 1,
        addedAt: prev?.addedAt ?? today(),
      };
    }
    store.set(next);
  },
  /** Takrorlash natijasi. `mastered: true` — savol daftardan chiqdi. */
  review(questionId: string, correct: boolean): { mastered: boolean } {
    const map = { ...store.get() };
    const entry = map[questionId];
    if (!entry) return { mastered: false };

    if (!correct) {
      map[questionId] = { ...entry, box: 0, due: plusDays(1), wrongCount: entry.wrongCount + 1 };
      store.set(map);
      return { mastered: false };
    }
    if (entry.box >= MAX_BOX) {
      delete map[questionId];
      store.set(map);
      return { mastered: true };
    }
    map[questionId] = { ...entry, box: entry.box + 1, due: plusDays(REVIEW_INTERVALS[entry.box]) };
    store.set(map);
    return { mastered: false };
  },
  remove(questionId: string) {
    const map = { ...store.get() };
    delete map[questionId];
    store.set(map);
  },
  clear: () => store.clear(),
};

/** `undefined` — yuklanmoqda */
export function useMistakes() {
  return store.useValue();
}

export function dueMistakes(map: MistakeMap, date: string) {
  return Object.values(map)
    .filter((m) => m.due <= date)
    .sort((a, b) => a.box - b.box || a.due.localeCompare(b.due));
}
