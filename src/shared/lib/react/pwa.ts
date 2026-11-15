"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Service worker'ni ro'yxatdan o'tkazadi (faqat production — dev'da eski kesh xalaqit beradi). */
export function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ro'yxatdan o'tmasa ham sayt ishlayveradi
    });
  }, []);
}

/** “Ilovani o'rnatish” tugmasi uchun: brauzer o'rnatishni taklif qila oladimi */
export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!event) return;
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setEvent(null);
  }

  return { canInstall: !!event, installed, install };
}
