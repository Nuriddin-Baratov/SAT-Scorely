"use client";

import { useEffect } from "react";

import { refreshSession, useSession } from "@/entities/user";
import { useLive } from "@/shared/api";
import { useI18n } from "@/shared/i18n";
import { STORAGE_CHANGE_EVENT } from "@/shared/lib/react";
import { confirmDialog } from "@/shared/ui/confirm";

import { hasUnsynced, syncNow } from "../model/sync";

const PUSH_DELAY_MS = 1_200;

/**
 * Ko'rinmas komponent: foydalanuvchi kirgan bo'lsa, progress bulut bilan real vaqtda sinxronlanadi —
 * o'zgarish ~1 soniyada yuboriladi, boshqa qurilmadagi o'zgarish signal orqali darhol keladi.
 */
export function SyncManager() {
  const session = useSession();
  const { t } = useI18n();
  const userId = session.status === "user" ? session.user.id : null;
  const confirmText = t.sync.confirmRestore;

  useLive(userId ? `user:${userId}` : null, () => {
    if (!userId) return;
    syncNow(userId).catch(() => {});
    // Ism, rol yoki Telegram ulanishi boshqa joyda o'zgargan bo'lishi mumkin
    void refreshSession();
  });

  useEffect(() => {
    if (!userId) return;
    syncNow(userId, () => confirmDialog({ title: confirmText, icon: "refresh" })).catch(() => {
      // Tarmoq xatosi — keyingi o'zgarishda yoki ilovaga qaytilganda qayta urinamiz
    });

    let timer: number | undefined;
    const push = () => {
      if (hasUnsynced()) syncNow(userId).catch(() => {});
    };
    const onChange = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(push, PUSH_DELAY_MS);
    };
    // Ilova yopilayotganda kutmasdan yuboramiz
    const onHide = () => {
      if (document.visibilityState !== "hidden") return;
      window.clearTimeout(timer);
      push();
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, onChange);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(STORAGE_CHANGE_EVENT, onChange);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [userId, confirmText]);

  return null;
}
