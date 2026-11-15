"use client";

import { createStorageStore } from "@/shared/lib/react";

import type { TestAttempt } from "./types";

const MAX_ATTEMPTS = 100;
const attemptsStore = createStorageStore<TestAttempt[]>("scorely.attempts.v1", []);

/** Test natijalari repozitoriyasi (hozircha brauzerda). */
export const attemptsRepository = {
  list: attemptsStore.get,
  add(attempt: Omit<TestAttempt, "id">) {
    const record: TestAttempt = { ...attempt, id: `${attempt.testId}-${Date.now().toString(36)}` };
    attemptsStore.set([record, ...attemptsStore.get()].slice(0, MAX_ATTEMPTS));
    return record;
  },
  clear: () => attemptsStore.clear(),
};

/** `undefined` — yuklanmoqda; yangi natijalar boshida */
export function useTestAttempts() {
  return attemptsStore.useValue();
}
