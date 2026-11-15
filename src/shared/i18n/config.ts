export const locales = ["uz", "ru", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uz";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeNames: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

/** `Intl` uchun to'liq til teglari */
export const localeTags: Record<Locale, string> = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-US",
};

export function hasLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** `/sat` → `/ru/sat`, `/` → `/ru` */
export function localizePath(locale: Locale, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** `/ru/sat` → `/sat` */
export function stripLocale(pathname: string | null) {
  if (!pathname) return "/";
  const [, first, ...rest] = pathname.split("/");
  if (!hasLocale(first)) return pathname || "/";
  return `/${rest.join("/")}`.replace(/\/$/, "") || "/";
}

/** Har bir til uchun matn (kontent ma'lumotlarida ishlatiladi) */
export type Localized = Record<Locale, string>;
