import type { Metadata } from "next";

import { defaultLocale, hasLocale, localizePath, locales, type Locale } from "./config";
import { getDictionary, type Dictionary } from "./dictionaries";

type PageKey = keyof Dictionary["meta"]["pages"];

export async function resolveLocale(params: Promise<{ lang: string }>): Promise<Locale> {
  const { lang } = await params;
  return hasLocale(lang) ? lang : defaultLocale;
}

/** `hreflang` muqobil havolalari */
export function languageAlternates(path: string): Record<string, string> {
  return Object.fromEntries(locales.map((l) => [l, localizePath(l, path)]));
}

/**
 * Sahifa uchun tilga mos `generateMetadata` yaratadi:
 * `export const generateMetadata = localizedMetadata("tests", "/tests")`
 */
export function localizedMetadata(key: PageKey, path: string, extra: Metadata = {}) {
  return async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const locale = await resolveLocale(params);
    const page = getDictionary(locale).meta.pages[key];
    return {
      title: page.title,
      description: page.description,
      alternates: { canonical: localizePath(locale, path), languages: languageAlternates(path) },
      ...extra,
    };
  };
}
