"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { defaultLocale, localizePath, type Locale } from "./config";
import { getDictionary, type Dictionary } from "./dictionaries";

interface I18nValue {
  locale: Locale;
  t: Dictionary;
  /** Ichki havolani joriy tilga moslaydi: `/sat` → `/ru/sat` */
  href: (path: string) => string;
}

const I18nContext = createContext<I18nValue>({
  locale: defaultLocale,
  t: getDictionary(defaultLocale),
  href: (path) => localizePath(defaultLocale, path),
});

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18nValue>(
    () => ({ locale, t: getDictionary(locale), href: (path) => localizePath(locale, path) }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Client komponentlar uchun: joriy til, lug'at va havola yordamchisi */
export function useI18n() {
  return useContext(I18nContext);
}
