/**
 * XP so'rovi: qurilma XP sonini EMAS, faqat javobni yuboradi — to'g'riligini va XP'ni server aniqlaydi.
 * Server ham, brauzer ham ishlatadi (`"use client"` yo'q).
 */
export type Answer = number | string | null;

export type XpClaimBody =
  | { type: "test"; id: string; testId: string; questionIds: string[]; answers: Answer[] }
  | { type: "daily"; date: string; choice: Answer }
  | { type: "practice"; questionId: string; answer: Answer }
  | { type: "review"; questionId: string; answer: Answer; mastered: boolean }
  | { type: "word"; word: string; choice: string }
  | { type: "listening"; lessonId: string; answers: Answer[] };

export type XpClaim = XpClaimBody & { id: string; day: string };

/** Bir marta hisoblanadigan hodisalar kaliti; `null` — cheklov yo'q (test: har urinish alohida) */
export function dedupeKey(claim: XpClaimBody, day: string): string | null {
  switch (claim.type) {
    case "test":
      return null;
    case "daily":
      return `daily:${claim.date}`;
    case "practice":
      return `practice:${claim.questionId}:${day}`;
    case "review":
      return `review:${claim.questionId}:${day}`;
    case "word":
      return `word:${claim.word}`;
    case "listening":
      return `listening:${claim.lessonId}:${day}`;
  }
}
