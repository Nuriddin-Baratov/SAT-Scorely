"use client";

import { createStorageStore } from "@/shared/lib/react";

import { applyEvent, initialGameState } from "./rules";
import type { BadgeId, GameEvent, GameState } from "./types";

const gameStore = createStorageStore<GameState>("scorely.game.v1", initialGameState);

export const gameRepository = {
  get: gameStore.get,
  /** Hodisani qayd etadi: XP, faol kun, nishonlar. */
  track(event: GameEvent) {
    const result = applyEvent({ ...initialGameState, ...gameStore.get() }, event, new Date());
    gameStore.set(result.state);
    return result;
  },
  markSeen(ids: BadgeId[]) {
    const state = gameStore.get();
    gameStore.set({ ...state, unseen: state.unseen.filter((id) => !ids.includes(id)) });
  },
  reset: () => gameStore.clear(),
};

/** `undefined` — yuklanmoqda */
export function useGameState() {
  const value = gameStore.useValue();
  return value === undefined ? undefined : { ...initialGameState, ...value };
}
