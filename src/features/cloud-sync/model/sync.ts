"use client";

import { currentStreak, gameRepository } from "@/entities/gamification";
import { attemptsRepository, domainPerformance } from "@/entities/practice-test";
import { api } from "@/shared/api";
import { collectSnapshot, toISODate, type Snapshot } from "@/shared/lib";
import { createStorageStore } from "@/shared/lib/react";

/** Qurilmaga xos sinxronizatsiya holati (snapshot'ga kirmaydi — `LOCAL_ONLY`) */
interface SyncMeta {
  userId: string | null;
  hash: string | null;
  lastSyncedAt: string | null;
}

export const syncMeta = createStorageStore<SyncMeta>("scorely.sync.v1", { userId: null, hash: null, lastSyncedAt: null });

/** Tez “barmoq izi” — ma'lumot o'zgarganini aniqlash uchun (djb2) */
export function fingerprint(snapshot: Snapshot) {
  const text = JSON.stringify(snapshot.data);
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return `${text.length}:${h.toString(36)}`;
}

/** Reyting va o'qituvchi paneli uchun qisqa statistika */
export function computeStats() {
  const today = toISODate(new Date());
  const game = gameRepository.get();
  const perf = Object.entries(domainPerformance(attemptsRepository.list()));
  const correct = perf.reduce((s, [, d]) => s + (d?.correct ?? 0), 0);
  const total = perf.reduce((s, [, d]) => s + (d?.total ?? 0), 0);
  const weak = perf
    .filter(([, d]) => d && d.total >= 3)
    .sort(([, a], [, b]) => a!.correct / a!.total - b!.correct / b!.total)[0];
  return {
    xp: game.xp ?? 0,
    streak: currentStreak(game.activeDays ?? [], today),
    accuracy: total ? correct / total : null,
    questions: total,
    weakDomain: weak && weak[1]!.correct / weak[1]!.total < 0.8 ? weak[0] : null,
    lastActive: game.activeDays?.at(-1) ?? null,
    today,
  };
}

/** Joriy ma'lumotlarni bulutga yuboradi (o'zgarmagan bo'lsa — yubormaydi, `force` bundan mustasno) */
export async function pushSnapshot({ force = false, keepalive = false } = {}) {
  const snapshot = collectSnapshot();
  const hash = fingerprint(snapshot);
  const meta = syncMeta.get();
  if (!force && meta.hash === hash) return false;
  const body = JSON.stringify({ snapshot, stats: computeStats() });
  await api("/api/sync", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
    // keepalive tanasi 64 KB bilan cheklangan
    keepalive: keepalive && body.length < 60_000,
  });
  syncMeta.set({ ...syncMeta.get(), hash, lastSyncedAt: new Date().toISOString() });
  return true;
}

export async function pullSnapshot() {
  return api<{ snapshot: unknown; updatedAt: string | null }>("/api/sync", { cache: "no-store" });
}

/** Chiqishda: keyingi kirishda bulut bilan qayta solishtirish uchun */
export function forgetSyncedUser() {
  syncMeta.set({ userId: null, hash: null, lastSyncedAt: null });
}
