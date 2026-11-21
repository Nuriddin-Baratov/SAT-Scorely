"use client";

import { useEffect, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Brauzer `beforeinstallprompt` hodisasini sahifa yuklanganda faqat bir marta yuboradi.
 * Shuning uchun uni ilova darajasida (Providers) ushlab, shu yerda saqlaymiz —
 * “O'rnatish” tugmasi keyinroq qaysi sahifada bo'lmasin ishlaydi.
 */
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function onBeforeInstall(event: Event) {
  event.preventDefault();
  deferred = event as BeforeInstallPromptEvent;
  emit();
}

function onInstalled() {
  installed = true;
  deferred = null;
  emit();
}

/** Ilova darajasida bir marta chaqiriladi: service worker va o'rnatish hodisalari. */
export function useServiceWorker() {
  useEffect(() => {
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    } else if ("serviceWorker" in navigator) {
      // dev: avvalgi production ishga tushirishdan qolgan worker eski JS'ni keshdan beradi
      // (hydration xatolari). Uni va keshlarini o'chirib, sahifani bir marta yangilaymiz.
      const controlled = !!navigator.serviceWorker.controller;
      void Promise.all([
        navigator.serviceWorker.getRegistrations().then((regs) => Promise.all(regs.map((r) => r.unregister()))),
        caches?.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
      ]).then(() => controlled && window.location.reload());
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const snapshot = () => (installed ? "installed" : deferred ? "available" : "none");

/** “Ilovani o'rnatish” tugmasi uchun holat */
export function useInstallPrompt() {
  const state = useSyncExternalStore(subscribe, snapshot, () => "none" as const);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") onInstalled();
    else {
      deferred = null;
      emit();
    }
  }

  return { canInstall: state === "available", installed: state === "installed", install };
}
