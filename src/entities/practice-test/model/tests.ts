import { scaleSection, type SectionId } from "@/entities/sat/@x/practice-test";

import { isCorrect } from "./answer";
import { getQuestion, questions } from "./questions";
import type { AdaptivePath, AnswerValue, PracticeTest, Question, TestAttempt } from "./types";

export const practiceTests: PracticeTest[] = [
  {
    id: "rw-diagnostic",
    kind: "rw",
    title: {
      uz: "O'qish va yozish — diagnostika",
      ru: "Чтение и письмо — диагностика",
      en: "Reading and Writing — diagnostic",
    },
    description: {
      uz: "Grammatika, so'z tanlash, bog'lovchilar va asosiy g'oya. Zaif tomonlaringizni aniqlash uchun.",
      ru: "Грамматика, выбор слова, связки и главная мысль. Чтобы найти слабые места.",
      en: "Grammar, word choice, transitions and main idea — to find your weak spots.",
    },
    minutes: 8,
    questionIds: [
      "rw-sva-exhibit",
      "rw-boundary-earle",
      "rw-transition-bicycles",
      "rw-words-spare",
      "rw-main-idea-bees",
      "rw-function-desert",
    ],
  },
  {
    id: "math-diagnostic",
    kind: "math",
    title: {
      uz: "Matematika — diagnostika",
      ru: "Математика — диагностика",
      en: "Math — diagnostic",
    },
    description: {
      uz: "Chiziqli tenglamalar, kvadrat tenglama, funksiyalar, foizlar va geometriya.",
      ru: "Линейные уравнения, квадратные уравнения, функции, проценты и геометрия.",
      en: "Linear equations, quadratics, functions, percentages and geometry.",
    },
    minutes: 10,
    questionIds: [
      "m-linear-solve",
      "m-quadratic-roots",
      "m-function-eval",
      "m-percent-sale",
      "m-pythagorean",
      "m-circle-area",
    ],
  },
  {
    id: "mixed-sprint",
    kind: "mixed",
    title: {
      uz: "Aralash sprint",
      ru: "Смешанный спринт",
      en: "Mixed sprint",
    },
    description: {
      uz: "Ikkala bo'limdan qisqa mashq — har kungi isitish uchun ideal.",
      ru: "Короткая практика из обоих разделов — идеальная ежедневная разминка.",
      en: "A short mix from both sections — a perfect daily warm-up.",
    },
    minutes: 8,
    questionIds: [
      "rw-tense-moon",
      "m-linear-model-gym",
      "rw-transition-city",
      "m-mean-missing",
      "m-system-sum-diff",
      "m-probability-marbles",
    ],
  },
  {
    id: "rw-advanced",
    kind: "rw",
    title: {
      uz: "O'qish va yozish — kengaytirilgan",
      ru: "Чтение и письмо — расширенный",
      en: "Reading and Writing — extended",
    },
    description: {
      uz: "Tinish belgilari, sintez, xulosa chiqarish va ma'lumotlar bilan ishlash. 10 ta savol.",
      ru: "Пунктуация, синтез, выводы и работа с данными. 10 вопросов.",
      en: "Punctuation, synthesis, inference and data. 10 questions.",
    },
    minutes: 13,
    questionIds: [
      "rw-possessive-birds",
      "rw-pronoun-neither",
      "rw-colon-list",
      "rw-transition-cactus",
      "rw-transition-bridge",
      "rw-synthesis-green-wall",
      "rw-words-meticulous",
      "rw-words-imitative",
      "rw-data-screen-time",
      "rw-inference-birds",
    ],
  },
  {
    id: "math-challenge",
    kind: "math",
    title: {
      uz: "Matematika — murakkab savollar",
      ru: "Математика — сложные задачи",
      en: "Math — challenge set",
    },
    description: {
      uz: "Yuqori ball uchun: diskriminant, to'liq kvadrat, foizlar zanjiri, trigonometriya.",
      ru: "Для высокого балла: дискриминант, полный квадрат, цепочки процентов, тригонометрия.",
      en: "For top scores: discriminants, completing the square, chained percentages, trig.",
    },
    minutes: 10,
    questionIds: [
      "m-plumber-rate",
      "m-one-solution",
      "m-percent-up-down",
      "m-sine-ratio",
      "m-vertex-minimum",
      "m-circle-radius",
    ],
  },
  {
    id: "math-adaptive",
    kind: "math",
    title: {
      uz: "Adaptiv matematika (2 modul)",
      ru: "Адаптивная математика (2 модуля)",
      en: "Adaptive math (2 modules)",
    },
    description: {
      uz: "Haqiqiy Digital SAT kabi: 1-modul natijasiga qarab 2-modul oson yoki qiyin bo'ladi.",
      ru: "Как настоящий Digital SAT: от результата модуля 1 зависит, будет модуль 2 лёгким или сложным.",
      en: "Like the real Digital SAT: your module 1 result decides whether module 2 is easier or harder.",
    },
    minutes: 12,
    questionIds: ["m-slope-points", "m-inequality", "m-exponential-bacteria", "m-median"],
    adaptive: {
      threshold: 3,
      easy: ["m-ratio-recipe", "m-triangle-angle", "m-equivalent-square", "m-percent-increase"],
      hard: ["m-system-no-solution", "m-vertex-minimum", "m-similar-area", "m-circle-radius"],
    },
  },
];

practiceTests.push({
  id: "full-simulation",
  kind: "mixed",
  simulation: true,
  title: {
    uz: "To'liq SAT simulyatori",
    ru: "Полный симулятор SAT",
    en: "Full SAT simulator",
  },
  description: {
    uz: "Haqiqiy tuzilma: 2 bo'lim × 2 adaptiv modul, tanaffus va 400–1600 shkalada ball. Savollar soni qisqartirilgan.",
    ru: "Реальная структура: 2 раздела × 2 адаптивных модуля, перерыв и балл по шкале 400–1600. Число вопросов сокращено.",
    en: "The real structure: 2 sections × 2 adaptive modules, a break and a 400–1600 score. Fewer questions per module.",
  },
  minutes: 46,
  questionIds: [],
});

/** Adaptiv testda oson yo'l bo'yicha bo'lim ballining yuqori chegarasi */
const EASY_PATH_CAP = 620;

export function getPracticeTest(id: string) {
  return practiceTests.find((t) => t.id === id);
}

function resolve(ids: string[]): Question[] {
  return ids.map((id) => {
    const q = getQuestion(id);
    if (!q) throw new Error(`Savol topilmadi: ${id}`);
    return q;
  });
}

/** Testning (yoki urinishning) savollari tartibda */
export function getTestQuestions(test: PracticeTest, attempt?: Pick<TestAttempt, "questionIds">): Question[] {
  return resolve(attempt?.questionIds ?? test.questionIds);
}

/** Adaptiv test: 1-modul javoblaridan 2-modulni tanlaydi */
export function chooseAdaptivePath(test: PracticeTest, moduleOneAnswers: AnswerValue[]): AdaptivePath {
  if (!test.adaptive) return "easy";
  const correct = resolve(test.questionIds).filter((q, i) => isCorrect(q, moduleOneAnswers[i])).length;
  return correct >= test.adaptive.threshold ? "hard" : "easy";
}

export function moduleTwoQuestions(test: PracticeTest, path: AdaptivePath): Question[] {
  return test.adaptive ? resolve(test.adaptive[path]) : [];
}

/** Barcha mumkin bo'lgan savollar soni (adaptiv testda 1 + 2-modul) */
export function testLength(test: PracticeTest) {
  return test.questionIds.length + (test.adaptive?.easy.length ?? 0);
}

export interface AttemptSummary {
  correct: number;
  total: number;
  accuracy: number;
  /** Testda qatnashgan har bir bo'lim uchun taxminiy 200–800 ball */
  sectionScores: Partial<Record<SectionId, number>>;
  wrongIds: string[];
  correctIds: string[];
}

export function summarizeAttempt(
  test: PracticeTest,
  attempt: Pick<TestAttempt, "answers" | "questionIds" | "path" | "paths">,
): AttemptSummary {
  const qs = getTestQuestions(test, attempt);
  const bySection: Partial<Record<SectionId, { correct: number; total: number }>> = {};
  const wrongIds: string[] = [];
  const correctIds: string[] = [];

  qs.forEach((q, i) => {
    const ok = isCorrect(q, attempt.answers[i]);
    (ok ? correctIds : wrongIds).push(q.id);
    const s = (bySection[q.sectionId] ??= { correct: 0, total: 0 });
    s.total++;
    if (ok) s.correct++;
  });

  const sectionScores: AttemptSummary["sectionScores"] = {};
  for (const [id, s] of Object.entries(bySection) as [SectionId, { correct: number; total: number }][]) {
    const score = scaleSection(s.correct / s.total);
    const path = attempt.paths?.[id] ?? attempt.path;
    sectionScores[id] = path === "easy" ? Math.min(score, EASY_PATH_CAP) : score;
  }

  const correct = correctIds.length;
  return { correct, total: qs.length, accuracy: qs.length ? correct / qs.length : 0, sectionScores, wrongIds, correctIds };
}

// ---------------- Mavzular bo'yicha natija ----------------

export interface DomainStat {
  correct: number;
  total: number;
  /** Sarflangan vaqt (soniya) — faqat vaqt yozilgan urinishlar uchun */
  seconds: number;
  timed: number;
}

/** Barcha urinishlardan mavzular (domenlar) bo'yicha to'g'ri javoblar va vaqt */
export function domainPerformance(attempts: TestAttempt[]) {
  const stats: Partial<Record<Question["domainId"], DomainStat>> = {};
  for (const attempt of attempts) {
    const test = getPracticeTest(attempt.testId);
    if (!test) continue;
    getTestQuestions(test, attempt).forEach((q, i) => {
      const s = (stats[q.domainId] ??= { correct: 0, total: 0, seconds: 0, timed: 0 });
      s.total++;
      if (isCorrect(q, attempt.answers[i])) s.correct++;
      const sec = attempt.times?.[i];
      if (typeof sec === "number" && sec > 0) {
        s.seconds += sec;
        s.timed++;
      }
    });
  }
  return stats;
}

// ---------------- To'liq imtihon simulyatori ----------------

export const SIMULATION_ID = "full-simulation";

/** Bo'lim moduli uchun savollar: 1-modul aralash, 2-modul yo'lga qarab */
export interface SimulationSection {
  sectionId: SectionId;
  moduleOne: Question[];
  easy: Question[];
  hard: Question[];
  /** Har bir modul uchun daqiqa */
  minutes: { moduleOne: number; moduleTwo: number };
}

function shuffle<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Haqiqiy SAT savol uchun vaqti (soniya): R&W ≈ 71, Math ≈ 95 */
const PACE: Record<SectionId, number> = { rw: 71, math: 95 };

/**
 * Savollar bankidan simulyator bo'limini yig'adi.
 * 1-modul: 2 oson + 3 o'rta + 2 qiyin; 2-modul (qiyin yo'l): qolgan qiyin + o'rta; (oson yo'l): qolgan oson + o'rta.
 */
export function buildSimulationSection(sectionId: SectionId, random: () => number = Math.random): SimulationSection {
  const pool = questions.filter((q) => q.sectionId === sectionId);
  const by = (d: Question["difficulty"]) => shuffle(pool.filter((q) => q.difficulty === d), random);
  const easy = by("easy");
  const medium = by("medium");
  const hard = by("hard");

  const moduleOne = shuffle([...easy.splice(0, 2), ...medium.splice(0, 3), ...hard.splice(0, 2)], random);
  const half = Math.ceil(medium.length / 2);
  const hardPath = [...hard.splice(0, 3), ...medium.slice(0, half)].slice(0, 6);
  const easyPath = [...easy.splice(0, 4), ...medium.slice(half)].slice(0, 6);
  const minutesFor = (n: number) => Math.max(3, Math.round((n * PACE[sectionId]) / 60));

  return {
    sectionId,
    moduleOne,
    hard: shuffle(hardPath, random),
    easy: shuffle(easyPath, random),
    minutes: { moduleOne: minutesFor(moduleOne.length), moduleTwo: minutesFor(Math.max(hardPath.length, easyPath.length)) },
  };
}

/** Simulyatorda 2-modul yo'li: 1-modulda kamida 5/7 to'g'ri bo'lsa — qiyin */
export function simulationPath(section: SimulationSection, answers: AnswerValue[]): AdaptivePath {
  const correct = section.moduleOne.filter((q, i) => isCorrect(q, answers[i])).length;
  return correct >= Math.ceil(section.moduleOne.length * 0.65) ? "hard" : "easy";
}
