import type { AnswerValue, Question } from "./types";

const LETTERS = ["A", "B", "C", "D"];

/** "1/2", "0,5", " .5 " → 0.5; son bo'lmasa `null` */
function toNumber(raw: string): number | null {
  const s = raw.trim().replace(/\s+/g, "").replace(",", ".").replace("−", "-");
  if (!s) return null;
  const fraction = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/.exec(s);
  if (fraction) {
    const den = Number(fraction[2]);
    return den === 0 ? null : Number(fraction[1]) / den;
  }
  return /^-?(\d+\.?\d*|\.\d+)$/.test(s) ? Number(s) : null;
}

/** Javob to'g'rimi — test va SPR savollari uchun yagona tekshiruv */
export function isCorrect(question: Question, answer: AnswerValue): boolean {
  if (answer === null || answer === "") return false;
  if (question.format !== "spr") return answer === question.answer;
  const given = String(answer);
  const value = toNumber(given);
  return question.accepted.some((ok) => {
    const target = toNumber(ok);
    if (value !== null && target !== null) return Math.abs(value - target) < 1e-4;
    return ok.trim().toLowerCase() === given.trim().toLowerCase();
  });
}

export function isAnswered(answer: AnswerValue) {
  return answer !== null && answer !== "";
}

/** Berilgan javobni matn ko'rinishida ("B. text" yoki "1/2") */
export function formatAnswer(question: Question, answer: AnswerValue): string | null {
  if (!isAnswered(answer)) return null;
  if (question.format === "spr") return String(answer);
  const i = Number(answer);
  return `${LETTERS[i]}. ${question.choices[i]}`;
}

/** To'g'ri javob matni */
export function correctAnswerText(question: Question): string {
  if (question.format === "spr") return question.accepted.join(" / ");
  return `${LETTERS[question.answer]}. ${question.choices[question.answer]}`;
}
