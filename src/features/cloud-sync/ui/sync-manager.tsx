"use client";

import { useEffect } from "react";

import { useSession } from "@/entities/user";
import { useI18n } from "@/shared/i18n";
import { applySnapshot, collectSnapshot, isSnapshot } from "@/shared/lib";

import { fingerprint, pullSnapshot, pushSnapshot, syncMeta } from "../model/sync";

const PUSH_INTERVAL_MS = 30_000;

/**
 * Ko'rinmas komponent: foydalanuvchi kirgan bo'lsa, brauzerdagi progressni bulut bilan sinxronlaydi.
 * Shu qurilmada birinchi marta kirilganda — bulutdagi nusxani tiklashni taklif qiladi.
 */
export function SyncManager() {
  const session = useSession();
  const { t } = useI18n();
  const userId = session.status === "user" ? session.user.id : null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function reconcile() {
      const meta = syncMeta.get();
      if (meta.userId === userId) return;
      const remote = await pullSnapshot();
      if (cancelled) return;
      const local = collectSnapshot();
      const localHasData = Object.keys(local.data).some((key) => key !== "scorely.sync.v1");

      if (isSnapshot(remote.snapshot) && Object.keys(remote.snapshot.data).length > 0) {
        if (!localHasData || window.confirm(t.sync.confirmRestore)) {
          applySnapshot(remote.snapshot);
          syncMeta.set({ userId, hash: fingerprint(remote.snapshot), lastSyncedAt: new Date().toISOString() });
          window.location.reload();
          return;
        }
      }
      syncMeta.set({ ...syncMeta.get(), userId, hash: null });
      await pushSnapshot({ force: true });
    }

    reconcile().catch(() => {
      // Tarmoq xatosi — keyingi intervalda qayta urinamiz
    });

    const interval = window.setInterval(() => {
      if (syncMeta.get().userId === userId) pushSnapshot().catch(() => {});
    }, PUSH_INTERVAL_MS);
    const onHide = () => {
      if (document.visibilityState === "hidden" && syncMeta.get().userId === userId) {
        pushSnapshot({ keepalive: true }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [userId, t.sync.confirmRestore]);

  return null;
}
