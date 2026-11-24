"use client";

import { currentStreak, gameRepository } from "@/entities/gamification";
import { attemptsRepository, domainPerformance } from "@/entities/practice-test";
import { ApiError, api } from "@/shared/api";
import { collectSnapshot, isSnapshot, isSyncKey, replaceSnapshot, toISODate } from "@/shared/lib";
import { createStorageStore } from "@/shared/lib/react";

import { canonical, mergeData, type Data } from "./merge";

/** Qurilmaga xos sinxronizatsiya holati (snapshot'ga kirmaydi — `LOCAL_ONLY`) */
interface SyncMeta {
  /** Shu qurilmadagi ma'lumot egasi (chiqilgandan keyin ham saqlanadi — begona hisobga aralashmasin) */
  userId: string | null;
  lastSyncedAt: string | null;
  /** Yuborilgan, lekin javobi hali kelmagan holatning izi */
  pending?: string | null;
}

export const syncMeta = createStorageStore<SyncMeta>("scorely.sync.v1", { userId: null, lastSyncedAt: null });
/** Oxirgi sinxronlangan holat — birlashtirishda asos */
const baseStore = createStorageStore<Data | null>("scorely.syncbase.v1", null);

const MAX_RETRIES = 4;

/** Tez “barmoq izi” (djb2) */
function fingerprint(data: Data) {
  const text = canonical(data);
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return `${text.length}:${h.toString(36)}`;
}

const syncable = (data: Data): Data => Object.fromEntries(Object.entries(data).filter(([key]) => isSyncKey(key)));
const localData = () => syncable(collectSnapshot().data);
const same = (a: Data, b: Data) => canonical(a) === canonical(b);

/** Haqiqiy natijalar bormi (faqat sozlama/so'rovnoma emas) */
function hasProgress(data: Data) {
  const filled = (v: unknown) => (Array.isArray(v) ? v.length > 0 : !!v && typeof v === "object" && Object.keys(v).length > 0);
  const game = data["scorely.game.v1"] as { xp?: number } | undefined;
  return (
    (game?.xp ?? 0) > 0 ||
    ["scorely.attempts.v1", "scorely.certificates.v1", "scorely.progress.v1", "scorely.mistakes.v1", "scorely.vocab.v1"].some((k) => filled(data[k]))
  );
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

async function pull() {
  const row = await api<{ snapshot: unknown; version: number }>("/api/sync", { cache: "no-store" });
  return { data: isSnapshot(row.snapshot) ? syncable(row.snapshot.data) : null, version: row.version ?? 0 };
}

/** Almashtirishdan oldin qurilmadagi nusxa (xato bo'lsa qaytarish uchun; sinxronlanmaydi) */
function backupLocal(data: Data) {
  if (!hasProgress(data)) return;
  try {
    window.localStorage.setItem("satpro.backup", JSON.stringify({ savedAt: new Date().toISOString(), data }));
  } catch {
    // joy yetmasa — zaxirasiz davom etamiz
  }
}

async function syncOnce(userId: string, askRestore: () => boolean) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const remote = await pull();
    const meta = syncMeta.get();
    const local = localData();
    let base = meta.userId === userId ? baseStore.get() : null;
    // Oldingi yuborish yetib borgan, faqat javobi yo'qolgan — asos o'sha holat
    if (remote.data && meta.userId === userId && meta.pending && fingerprint(remote.data) === meta.pending) base = remote.data;

    let next: Data;
    if (meta.userId && meta.userId !== userId) {
      // Qurilmada boshqa hisobning ma'lumoti turibdi — aralashtirilmaydi
      backupLocal(local);
      next = remote.data ?? {};
    } else if (!remote.data) {
      next = local;
    } else if (!meta.userId && hasProgress(local) && hasProgress(remote.data) && !same(local, remote.data) && askRestore()) {
      backupLocal(local);
      next = remote.data;
    } else {
      next = mergeData(base, local, remote.data);
    }

    // So'rov davomida foydalanuvchi yana nimadir ishlagan bo'lsa — eskisi bilan bosib ketmaymiz
    if (!same(localData(), local)) continue;
    if (!same(next, local)) replaceSnapshot(next);
    syncMeta.set({ ...syncMeta.get(), userId });

    if (remote.data && same(next, remote.data)) {
      baseStore.set(next);
      syncMeta.set({ userId, lastSyncedAt: new Date().toISOString(), pending: null });
      return;
    }
    syncMeta.set({ ...syncMeta.get(), pending: fingerprint(next) });
    try {
      await api("/api/sync", {
        method: "PUT",
        json: {
          snapshot: { app: "scorely", version: 1, exportedAt: new Date().toISOString(), data: next },
          stats: computeStats(),
          baseVersion: remote.version,
        },
      });
      baseStore.set(next);
      syncMeta.set({ userId, lastSyncedAt: new Date().toISOString(), pending: null });
      return;
    } catch (error) {
      // Shu orada boshqa qurilma yozdi — yangi nusxa bilan qayta birlashtiramiz
      if (!(error instanceof ApiError) || error.code !== "conflict") throw error;
      baseStore.set(remote.data ?? null);
      syncMeta.set({ ...syncMeta.get(), pending: null });
    }
  }
  throw new Error("sync: too many conflicts");
}

let running: Promise<void> | null = null;
let again = false;

/** Bulut bilan ikki tomonlama sinxronlash. Bir vaqtda bittasi ishlaydi; oradagi so'rovlar bittaga yig'iladi. */
export function syncNow(userId: string, askRestore: () => boolean = () => false): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      await syncOnce(userId, askRestore);
    } while (again);
  })().finally(() => {
    running = null;
  });
  return running;
}

/** Bulutdagi holatni shu qurilmaga aynan yozish (Sozlamalar → “Bulutdan tiklash”) */
export async function restoreFromCloud(userId: string) {
  const remote = await pull();
  if (!remote.data) return false;
  backupLocal(localData());
  replaceSnapshot(remote.data);
  baseStore.set(remote.data);
  syncMeta.set({ userId, lastSyncedAt: new Date().toISOString(), pending: null });
  return true;
}

/** Oxirgi sinxronlashdan beri o'zgarish bormi */
export function hasUnsynced() {
  const base = baseStore.get();
  return !base || !same(base, localData());
}

/** Chiqishda: ma'lumot egasi eslab qolinadi, faqat kutilayotgan yuborish bekor bo'ladi */
export function forgetSyncedUser() {
  syncMeta.set({ ...syncMeta.get(), pending: null });
}
