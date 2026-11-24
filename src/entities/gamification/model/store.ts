"use client";

import { toISODate } from "@/shared/lib";
import { createStorageStore } from "@/shared/lib/react";

import { dedupeKey, type XpClaim, type XpClaimBody } from "./claims";
import { xpOutbox } from "./outbox";
import { applyEvent, initialGameState, xpFor } from "./rules";
import type { BadgeId, GameEvent, GameState } from "./types";

const gameStore = createStorageStore<GameState>("scorely.game.v1", initialGameState);

export const gameRepository = {
  get: gameStore.get,
  /**
   * Hodisani qayd etadi: faol kun, nishonlar va taxminiy XP (darhol ko'rinishi uchun).
   * `body` — serverga yuboriladigan javob; haqiqiy XP'ni server hisoblaydi va qaytaradi.
   */
  track(event: GameEvent, body: XpClaimBody) {
    const now = new Date();
    const day = toISODate(now);
    const id = body.type === "test" ? body.id : `${body.type}-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    const claim = { ...body, id, day } as XpClaim;
    const fresh = xpOutbox.add(claim, xpFor(event), dedupeKey(body, day));
    const result = applyEvent({ ...initialGameState, ...gameStore.get() }, event, now, fresh ? xpFor(event) : 0);
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
