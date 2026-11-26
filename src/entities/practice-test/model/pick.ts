import type { DomainId, SectionId } from "@/entities/sat/@x/practice-test";

import { questions } from "./questions";
import type { Question } from "./types";

/** Barqaror tasodif: bir xil `seed` — bir xil tartib (sahifa yangilansa ham savollar o'zgarmaydi) */
function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Mashg'ulot uchun savollar: avval shu mavzu va qiyinlik, yetmasa — shu mavzuning boshqa qiyinliklari,
 * keyin shu bo'lim. `difficulty: "mixed"` — qiyinlik bo'yicha tanlanmaydi.
 */
export function pickQuestions(opts: {
  domainId: DomainId | null;
  section: SectionId | null;
  difficulty: Question["difficulty"] | "mixed";
  count: number;
  seed: string;
}): Question[] {
  const random = seeded(opts.seed);
  const shuffle = (list: Question[]) => list.map((q) => [random(), q] as const).sort((a, b) => a[0] - b[0]).map(([, q]) => q);
  const inSection = questions.filter((q) => !opts.section || q.sectionId === opts.section);
  const inDomain = inSection.filter((q) => !opts.domainId || q.domainId === opts.domainId);
  const tiers = [
    inDomain.filter((q) => opts.difficulty === "mixed" || q.difficulty === opts.difficulty),
    inDomain,
    inSection,
  ];
  const picked: Question[] = [];
  for (const tier of tiers) {
    for (const q of shuffle(tier)) {
      if (picked.length >= opts.count) break;
      if (!picked.includes(q)) picked.push(q);
    }
  }
  return picked;
}
