export const MONTHS_SHORT = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
export const WEEKDAYS_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
export const WEEKDAYS_LONG = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];

export const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` ko'rinishidagi mahalliy sana. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Dushanba = 0 … Yakshanba = 6 */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

export function formatDate(iso: string, withYear = false): string {
  const date = parseISODate(iso);
  const base = `${date.getDate()}-${MONTHS_SHORT[date.getMonth()]}`;
  return withYear ? `${base}, ${date.getFullYear()}` : base;
}

