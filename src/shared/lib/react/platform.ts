"use client";

import { useSyncExternalStore } from "react";

/** `app` — ilova ichida (APK yoki bosh ekranga o'rnatilgan); `ios-inapp` — iPhone'da Telegram/Instagram ichki brauzeri */
export type Platform = "app" | "android" | "ios" | "ios-inapp" | "desktop";

let cached: Platform | undefined;

function detect(): Platform {
  const ua = navigator.userAgent;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  if (standalone || ua.includes("SATProApp")) return "app";
  if (/Android/i.test(ua)) return "android";
  // iPadOS o'zini Mac deb tanitadi
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
    // Ichki brauzerlarda "Ekranga qo'shish" yo'q
    return !/Safari\//.test(ua) || /FBAN|FBAV|Instagram|Line\/|Telegram/i.test(ua) ? "ios-inapp" : "ios";
  }
  return "desktop";
}

/** Serverda va gidratsiyada `undefined` */
export function usePlatform(): Platform | undefined {
  return useSyncExternalStore(
    () => () => {},
    () => (cached ??= detect()),
    () => undefined,
  );
}
