/**
 * `/tests/<id>` sahifasi mavjud bo'lgan testlar (simulyatorsiz). Proxy shu ro'yxat bo'yicha
 * noma'lum test manzillariga oqim boshlanishidan oldin haqiqiy 404 qaytaradi.
 * Bu fayl ataylab yengil — proxy savollar bankini yuklamasligi uchun.
 * Yangi test qo'shilsa, id'sini shu yerga ham yozing (dev rejimida `tests.ts` eslatadi).
 */
export const TEST_PAGE_IDS: readonly string[] = [
  "rw-diagnostic",
  "math-diagnostic",
  "mixed-sprint",
  "rw-advanced",
  "math-challenge",
  "math-adaptive",
  "final-exam",
];
