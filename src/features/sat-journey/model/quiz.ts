import type { DomainId } from "@/entities/sat";
import type { Level, Rating, StudentProfile } from "@/entities/student";
import { estimateBaseline } from "@/entities/study-plan";
import { addDays, toISODate } from "@/shared/lib";

export type CurrentScore = "none" | "400-800" | "800-1000" | "1000-1200" | "1200-1400" | "1400+";
export type HardSection = "math" | "rw" | "both";

export interface Answers {
  current: CurrentScore;
  target: 1200 | 1300 | 1400 | 1500;
  /** 0 — hali bilmayman */
  months: 1 | 3 | 6 | 0;
  minutes: 30 | 60 | 120 | 180;
  hard: HardSection;
}

export const questions = [
  { key: "current", options: ["none", "400-800", "800-1000", "1000-1200", "1200-1400", "1400+"] },
  { key: "target", options: [1200, 1300, 1400, 1500] },
  { key: "months", options: [1, 3, 6, 0] },
  { key: "minutes", options: [30, 60, 120, 180] },
  { key: "hard", options: ["math", "rw", "both"] },
] as const satisfies { key: keyof Answers; options: readonly Answers[keyof Answers][] }[];

/** Oraliq o'rtasi; "none" — taxminiy boshlang'ich nuqta */
const scoreMid: Record<CurrentScore, number> = {
  none: 800,
  "400-800": 650,
  "800-1000": 900,
  "1000-1200": 1100,
  "1200-1400": 1300,
  "1400+": 1450,
};

const MATH = [
  "Linear equations", "Linear functions", "Systems of equations", "Inequalities", "Ratios & percentages",
  "Statistics & data", "Probability", "Quadratics", "Exponential functions", "Polynomials & radicals",
  "Nonlinear equations", "Area & volume", "Lines, angles & triangles", "Right triangles & trig", "Circles",
];
const RW = [
  "Words in context", "Text structure & purpose", "Central ideas", "Command of evidence", "Inferences",
  "Cross-text connections", "Boundaries (punctuation)", "Form, structure & sense", "Transitions",
  "Rhetorical synthesis", "Quantitative evidence",
];

export interface WeekPlan {
  index: number;
  math: string[];
  rw: string[];
  test: boolean;
  final: boolean;
}

export interface PersonalPlan {
  level: Level;
  current: number;
  target: number;
  gap: number;
  weeks: WeekPlan[];
  perWeek: number;
  daily: { math: number; rw: number; review: number; questions: number; words: number };
}

function levelOf(a: Answers): Level {
  const s = scoreMid[a.current];
  return a.current === "none" || s < 1000 ? "beginner" : s < 1300 ? "intermediate" : "advanced";
}

export function buildPlan(a: Answers): PersonalPlan {
  const level = levelOf(a);
  // Bal va hafta soni asosiy reja generatori bilan bir xil hisoblanadi — dashboarddagi raqamlar mos kelsin.
  const current = estimateBaseline(toProfile(a, { name: "", email: "" })).total;
  const gap = Math.max(0, a.target - current);
  const count = a.months ? Math.ceil((a.months * 30) / 7) : gap <= 80 ? 8 : gap <= 180 ? 12 : 16;

  // Qiyin bo'limga ko'proq vaqt
  const mathShare = a.hard === "math" ? 0.6 : a.hard === "rw" ? 0.4 : 0.5;
  const review = Math.max(5, Math.round((a.minutes * 0.15) / 5) * 5);
  const mathMin = Math.round(((a.minutes - review) * mathShare) / 5) * 5;
  const rwMin = a.minutes - review - mathMin;

  const extra = a.minutes >= 120 ? 1 : 0;
  const perSection = (s: "math" | "rw") => (a.hard === s || a.hard === "both" ? 2 : 1) + extra;
  const offset = { beginner: 0, intermediate: 3, advanced: 6 }[level];
  const pick = (list: string[], n: number, i: number) =>
    Array.from({ length: n }, (_, k) => list[(offset + i * n + k) % list.length]);

  const weeks = Array.from({ length: count }, (_, i): WeekPlan => {
    const final = i === count - 1 && count >= 4;
    return {
      index: i + 1,
      math: final ? [] : pick(MATH, perSection("math"), i),
      rw: final ? [] : pick(RW, perSection("rw"), i),
      test: (i + 1) % 2 === 0 || final,
      final,
    };
  });

  return {
    level,
    current,
    target: a.target,
    gap,
    weeks,
    perWeek: Math.ceil(gap / count),
    daily: {
      math: mathMin,
      rw: rwMin,
      review,
      questions: Math.round((mathMin + rwMin) / 2.5),
      words: rwMin >= 20 ? 15 : 10,
    },
  };
}

/** Javoblarni mavjud profil modeliga o'giradi — dashboard va kengaytirilgan reja shu orqali ishlaydi. */
export function toProfile(a: Answers, account: { name: string; email: string }, prev?: StudentProfile | null): StudentProfile {
  const level = levelOf(a);
  const current = scoreMid[a.current];
  const base = { beginner: 2, intermediate: 3, advanced: 4 }[level];
  const rating = (s: "math" | "rw") => Math.max(1, base - (a.hard === s || a.hard === "both" ? 1 : 0)) as Rating;
  const rwDomains: DomainId[] = ["craft-structure", "information-ideas", "conventions", "expression-ideas"];
  const mathDomains: DomainId[] = ["algebra", "advanced-math", "data-analysis", "geometry-trig"];
  const shift = a.hard === "math" ? 30 : a.hard === "rw" ? -30 : 0;
  const half = (v: number) => Math.min(800, Math.max(200, Math.round(v / 10) * 10));
  const today = new Date();

  return {
    fullName: account.name,
    email: account.email,
    phone: prev?.phone ?? "",
    grade: prev?.grade ?? "11",
    level,
    englishLevel: level === "beginner" ? "B1" : level === "intermediate" ? "B2" : "C1",
    scoreSource: a.current === "none" ? "none" : "practice",
    lastScore: a.current === "none" ? { rw: null, math: null } : { rw: half(current / 2 + shift), math: half(current / 2 - shift) },
    domainRatings: Object.fromEntries([
      ...rwDomains.map((d) => [d, rating("rw")]),
      ...mathDomains.map((d) => [d, rating("math")]),
    ]) as Record<DomainId, Rating>,
    targetScore: a.target,
    testDate: a.months ? toISODate(addDays(today, a.months * 30)) : null,
    studyDays: [0, 1, 2, 3, 4, 5],
    sessionMinutes: a.minutes,
    goals: prev?.goals ?? "",
    planStartDate: toISODate(today),
    createdAt: prev?.createdAt ?? today.toISOString(),
  };
}
