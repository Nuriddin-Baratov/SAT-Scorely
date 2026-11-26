"use client";

import { xpOutbox } from "@/entities/gamification";
import { getPracticeTest, type TestAttempt } from "@/entities/practice-test";
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
const CLAIM_BATCH = 50;

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

/** Navbatdagi javoblarni serverga yuboradi (server tekshirib, XP beradi). Takror yuborish xavfsiz. */
async function flushXp() {
  for (let round = 0; round < 20; round++) {
    const claims = xpOutbox.list().slice(0, CLAIM_BATCH).map((i) => i.claim);
    if (!claims.length) return;
    const { results } = await api<{ results: { id: string; xp: number }[] }>("/api/xp", { method: "POST", json: { claims } });
    xpOutbox.remove(new Set([...results.map((r) => r.id), ...claims.map((c) => c.id)]));
  }
}

/** Server bilmaydigan eski natijalar (hisob avval faqat shu qurilmada bo'lgan): javoblar tekshirish uchun yuboriladi */
function queueLegacy(data: Data) {
  const day = toISODate(new Date());
  for (const attempt of (data["scorely.attempts.v1"] as TestAttempt[] | undefined) ?? []) {
    const ids = attempt.questionIds ?? getPracticeTest(attempt.testId)?.questionIds;
    if (!ids) continue;
    xpOutbox.add({ type: "test", id: attempt.id, testId: attempt.testId, questionIds: ids, answers: attempt.answers, day }, 0, null);
  }
  for (const [word, status] of Object.entries((data["scorely.vocab.v1"] as Record<string, string> | undefined) ?? {})) {
    if (status === "known") xpOutbox.add({ type: "word", id: `word-${word}`, word, choice: word, day }, 0, `word:${word}`);
  }
}

/** XP — serverdagi son (+ hali yuborilmagan javoblar taxmini) */
function withServerXp(data: Data, xp: number): Data {
  const game = data["scorely.game.v1"] as { xp?: number } | undefined;
  const value = xp + xpOutbox.pendingXp();
  if (!game) return value ? { ...data, "scorely.game.v1": { xp: value, activeDays: [], badges: {}, unseen: [], daily: {} } } : data;
  return game.xp === value ? data : { ...data, "scorely.game.v1": { ...game, xp: value } };
}

async function pull() {
  const row = await api<{ snapshot: unknown; version: number; xp: number }>("/api/sync", { cache: "no-store" });
  return { data: isSnapshot(row.snapshot) ? syncable(row.snapshot.data) : null, version: row.version ?? 0, xp: row.xp ?? 0 };
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

async function syncOnce(userId: string, askRestore: () => Promise<boolean>) {
  const owner = syncMeta.get().userId;
  // Boshqa hisobning yuborilmagan javoblari bu hisobga yozilmaydi
  if (owner && owner !== userId) xpOutbox.clear();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await flushXp();
    let remote = await pull();
    const meta = syncMeta.get();
    const local = localData();
    if (!remote.data && !meta.userId && hasProgress(local)) {
      queueLegacy(local);
      await flushXp();
      remote = await pull();
    }
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
    } else if (!meta.userId && hasProgress(local) && hasProgress(remote.data) && !same(local, remote.data) && (await askRestore())) {
      backupLocal(local);
      next = remote.data;
    } else {
      next = mergeData(base, local, remote.data);
    }

    next = withServerXp(next, remote.xp);

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
export function syncNow(userId: string, askRestore: () => Promise<boolean> = async () => false): Promise<void> {
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
  const data = withServerXp(remote.data, remote.xp);
  replaceSnapshot(data);
  baseStore.set(data);
  syncMeta.set({ userId, lastSyncedAt: new Date().toISOString(), pending: null });
  return true;
}

/** Oxirgi sinxronlashdan beri o'zgarish bormi */
export function hasUnsynced() {
  const base = baseStore.get();
  return xpOutbox.list().length > 0 || !base || !same(base, localData());
}

/** Chiqishda: ma'lumot egasi eslab qolinadi, faqat kutilayotgan yuborish bekor bo'ladi */
export function forgetSyncedUser() {
  syncMeta.set({ ...syncMeta.get(), pending: null });
}
