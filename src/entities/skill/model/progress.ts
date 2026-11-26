"use client";

import { createStorageStore } from "@/shared/lib/react";

/** Tinglash darslari: dars → eng yaxshi natija (to'g'ri javoblar soni) */
const store = createStorageStore<Record<string, number>>("scorely.listening.v1", {});

export const listeningRepository = {
  get: store.get,
  record(lessonId: string, correct: number) {
    const prev = store.get();
    if ((prev[lessonId] ?? -1) < correct) store.set({ ...prev, [lessonId]: correct });
  },
};

export function useListeningProgress() {
  return store.useValue();
}
