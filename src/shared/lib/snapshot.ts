/** Brauzerda saqlangan barcha Scorely ma'lumotlari (localStorage) uchun yordamchilar. */
export const STORAGE_PREFIX = "scorely.";

/** Qurilmaga xos sozlamalar — eksport/sinxronizatsiyaga kirmaydi */
const LOCAL_ONLY = new Set(["scorely.theme.v1", "scorely.sync.v1"]);

export interface Snapshot {
  app: "scorely";
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function collectSnapshot(): Snapshot {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith(STORAGE_PREFIX) || LOCAL_ONLY.has(key)) continue;
    try {
      data[key] = JSON.parse(window.localStorage.getItem(key) ?? "null");
    } catch {
      // buzilgan yozuv — o'tkazib yuboramiz
    }
  }
  return { app: "scorely", version: 1, exportedAt: new Date().toISOString(), data };
}

export function isSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<Snapshot>;
  return v.app === "scorely" && v.version === 1 && !!v.data && typeof v.data === "object";
}

/** Ma'lumotlarni yozadi (faqat `scorely.` kalitlari). Qaytaradi: yozilgan kalitlar soni. */
export function applySnapshot(snapshot: Snapshot): number {
  let count = 0;
  for (const [key, value] of Object.entries(snapshot.data)) {
    if (!key.startsWith(STORAGE_PREFIX) || LOCAL_ONLY.has(key)) continue;
    window.localStorage.setItem(key, JSON.stringify(value));
    count++;
  }
  return count;
}

/**
 * Shu qurilmadagi barcha Scorely ma'lumotlarini o'chiradi (mavzu sozlamasidan tashqari).
 * Sinxronizatsiya belgisi ham o'chiriladi — aks holda bo'sh holat bulutga yozilib,
 * bulutdagi progress ham yo'qolardi. Endi keyingi ochilishda bulutdan tiklash taklif qilinadi.
 */
export function clearSnapshot() {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX) && key !== "scorely.theme.v1") keys.push(key);
  }
  keys.forEach((key) => window.localStorage.removeItem(key));
}
