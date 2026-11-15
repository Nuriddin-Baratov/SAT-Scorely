import { questions } from "./questions";

/** Kunlik savol faqat 4 variantli savollardan (Telegram tugmalari bilan ham ishlashi uchun). */
const pool = questions.filter((q) => q.format !== "spr");

/** Sana bo'yicha barqaror “kunlik savol” — hamma uchun bir xil, har kuni yangi. */
export function dailyQuestionFor(date: string) {
  let hash = 0;
  for (const ch of `scorely:${date}`) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[hash % pool.length];
}
