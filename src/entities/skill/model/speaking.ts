import type { SkillLevel } from "./listening";

/** Ovoz chiqarib o'qish uchun matnlar */
export const readAloudTexts: { id: string; level: SkillLevel; text: string }[] = [
  { id: "ra-1", level: "B1", text: "Learning a new language takes time, but small daily practice makes a big difference." },
  { id: "ra-2", level: "B1", text: "Our school library is open every day except Sunday, from eight in the morning until six in the evening." },
  { id: "ra-3", level: "B2", text: "Scientists believe that regular sleep helps the brain store new information in long-term memory." },
  { id: "ra-4", level: "B2", text: "Although the experiment failed at first, the team learned valuable lessons that led to later success." },
  { id: "ra-5", level: "C1", text: "The author contends that technological progress, while beneficial, has also created unprecedented challenges for privacy." },
  { id: "ra-6", level: "C1", text: "Urban planners increasingly emphasize green spaces, recognizing their measurable effects on public health and wellbeing." },
];

/** Erkin gapirish mavzulari: tayyorgarlik + gapirish vaqti bilan */
export const speakingTopics: { id: string; level: SkillLevel; prompt: string; hints: string[] }[] = [
  { id: "st-1", level: "B1", prompt: "Describe your favorite place in your city and explain why you like it.", hints: ["Where is it?", "What do you do there?", "Who do you go with?", "Why is it special?"] },
  { id: "st-2", level: "B1", prompt: "Talk about a skill you would like to learn in the future.", hints: ["What skill?", "Why does it interest you?", "How will you learn it?", "How will it help you?"] },
  { id: "st-3", level: "B2", prompt: "Some people think students should wear school uniforms. Do you agree or disagree?", hints: ["Your opinion", "Reason 1 with an example", "Reason 2 with an example", "A short conclusion"] },
  { id: "st-4", level: "B2", prompt: "Describe a book, film, or teacher that changed the way you think.", hints: ["What or who was it?", "When did you meet it?", "What changed?", "Why it still matters"] },
  { id: "st-5", level: "C1", prompt: "Should universities admit students based only on test scores? Explain your view.", hints: ["Clear position", "Strongest argument", "A counterargument", "Why your view is stronger"] },
  { id: "st-6", level: "C1", prompt: "How will artificial intelligence change education in the next ten years?", hints: ["Main change", "One benefit", "One risk", "What students should do"] },
];

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/**
 * Kutilgan matnni aytilgan/yozilgan matn bilan so'zma-so'z solishtiradi (eng uzun umumiy ketma-ketlik).
 * Har bir kutilgan so'z uchun: topildimi.
 */
export function compareWords(expected: string, actual: string) {
  const words = expected.split(/\s+/).filter(Boolean);
  const a = words.map((w) => normalize(w).join(""));
  const b = normalize(actual);
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] && a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const matched = new Array<boolean>(a.length).fill(false);
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (a[i] && a[i] === b[j]) {
      matched[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const counted = a.filter(Boolean).length;
  const hits = matched.filter(Boolean).length;
  return { words: words.map((word, i) => ({ word, ok: matched[i] || !a[i] })), score: counted ? Math.round((hits / counted) * 100) : 0 };
}
