import { WEEKDAYS_LONG, WEEKDAYS_SHORT, formatDate, parseISODate } from "@/shared/lib";

import { localeTags, type Locale } from "./config";

const weekdays: Record<Locale, { short: string[]; long: string[] }> = {
  uz: { short: WEEKDAYS_SHORT, long: WEEKDAYS_LONG },
  ru: {
    short: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    long: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
  },
  en: {
    short: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    long: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  },
};

/** Hafta kunlari (Dushanba = 0) tanlangan tilda */
export function weekdayNames(locale: Locale, style: "short" | "long" = "short") {
  return weekdays[locale][style];
}

/** `YYYY-MM-DD` → “15-noy” / “15 нояб.” / “Nov 15” */
export function formatDay(iso: string, locale: Locale, withYear = false) {
  // O'zbekcha uchun o'zimizning format (brauzerlarda uz-UZ qo'llab-quvvatlashi bir xil emas).
  if (locale === "uz") return formatDate(iso, withYear);
  return new Intl.DateTimeFormat(localeTags[locale], {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(parseISODate(iso));
}

/** Minutlarni o'qiladigan ko'rinishda: 45 → “45 daq”, 90 → “1,5 soat” */
export function formatMinutes(minutes: number, locale: Locale) {
  const units = { uz: ["daq", "soat"], ru: ["мин", "ч"], en: ["min", "h"] }[locale];
  if (minutes < 60) return `${minutes} ${units[0]}`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${locale === "en" ? hours : String(hours).replace(".", ",")} ${units[1]}`;
}
