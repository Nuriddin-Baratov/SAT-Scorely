"use client";

import { createStorageStore } from "@/shared/lib/react";

export type ThemeMode = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "scorely.theme.v1";

const themeStore = createStorageStore<ThemeMode>(THEME_STORAGE_KEY, "system");

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") delete root.dataset.theme;
  else root.dataset.theme = mode;
}

export function setTheme(mode: ThemeMode) {
  themeStore.set(mode);
  applyTheme(mode);
}

/** `undefined` — hali o'qilmagan (SSR) */
export function useTheme() {
  return themeStore.useValue();
}
