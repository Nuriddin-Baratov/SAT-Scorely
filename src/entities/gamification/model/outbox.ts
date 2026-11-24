"use client";

import { createStorageStore } from "@/shared/lib/react";

import type { XpClaim } from "./claims";

/**
 * Serverga yuborilishi kerak bo'lgan javoblar navbati (internet bo'lmasa shu yerda turadi).
 * `gained` — server tasdiqlaguncha ekranda ko'rsatiladigan taxminiy XP.
 */
export interface PendingClaim {
  claim: XpClaim;
  gained: number;
}

interface Outbox {
  items: PendingClaim[];
  /** Bugun hisoblangan takrorlanmas kalitlar (server ham xuddi shunday tekshiradi) */
  seen: { day: string; keys: string[] };
}

const empty: Outbox = { items: [], seen: { day: "", keys: [] } };
const store = createStorageStore<Outbox>("scorely.outbox.v1", empty);
const MAX_ITEMS = 1_000;

export const xpOutbox = {
  list: () => store.get().items,
  /** Navbatga qo'shadi; bugun allaqachon hisoblangan bo'lsa `false` (XP berilmaydi) */
  add(claim: XpClaim, gained: number, key: string | null): boolean {
    const box = store.get();
    const keys = box.seen.day === claim.day ? box.seen.keys : [];
    if (key && keys.includes(key)) return false;
    store.set({
      items: [...box.items, { claim, gained }].slice(-MAX_ITEMS),
      seen: { day: claim.day, keys: key ? [...keys, key] : keys },
    });
    return true;
  },
  /** Server javob bergan yozuvlarni o'chiradi */
  remove(ids: Set<string>) {
    const box = store.get();
    store.set({ ...box, items: box.items.filter((i) => !ids.has(i.claim.id)) });
  },
  pendingXp: () => store.get().items.reduce((sum, i) => sum + i.gained, 0),
  clear: () => store.clear(),
};
