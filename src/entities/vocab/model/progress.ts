"use client";

import { createStorageStore } from "@/shared/lib/react";

export type WordStatus = "known" | "learning";

const store = createStorageStore<Record<string, WordStatus>>("scorely.vocab.v1", {});

export const vocabRepository = {
  get: store.get,
  /** Holatni o'rnatadi; so'z birinchi marta “known” bo'lsa `true` qaytaradi. */
  mark(word: string, status: WordStatus) {
    const prev = store.get();
    const firstTimeKnown = status === "known" && prev[word] !== "known";
    store.set({ ...prev, [word]: status });
    return firstTimeKnown;
  },
  reset: () => store.clear(),
};

export function useVocabProgress() {
  return store.useValue();
}
