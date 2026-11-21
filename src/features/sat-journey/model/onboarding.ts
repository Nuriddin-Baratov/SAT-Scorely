import type { DomainId } from "@/entities/sat";
import type { EnglishLevel, Grade, Level, Rating, StudentProfile } from "@/entities/student";
import { addDays, parseISODate, toISODate } from "@/shared/lib";

/** Ro'yxatdan o'tgandan keyingi "o'quvchi haqida" so'rovnoma (testsiz). */
export interface OnboardingDraft {
  phone: string;
  city: string;
  grade: Grade;
  englishLevel: EnglishLevel;
  taken: boolean;
  rw: number | null;
  math: number | null;
  target: number;
  universities: string;
  reason: string;
  /** `YYYY-MM-DD` yoki noma'lum */
  testDate: string | null;
  hours: number;
  /** 0 = Dushanba … 6 = Yakshanba */
  studyDays: number[];
  weak: DomainId[];
}

export const onboardingSteps = ["about", "level", "goal", "time", "weak"] as const;
export type OnboardingError = "phone" | "score" | "testDate" | "days";

export const ALL_DOMAINS: DomainId[] = [
  "information-ideas",
  "craft-structure",
  "expression-ideas",
  "conventions",
  "algebra",
  "advanced-math",
  "data-analysis",
  "geometry-trig",
];

export function createOnboardingDraft(today: string, prev?: StudentProfile | null): OnboardingDraft {
  const weak = prev ? ALL_DOMAINS.filter((d) => prev.domainRatings[d] <= 2) : [];
  return {
    phone: prev?.phone ?? "",
    city: prev?.city ?? "",
    grade: prev?.grade ?? "11",
    englishLevel: prev?.englishLevel ?? "B2",
    taken: prev ? prev.scoreSource !== "none" : false,
    rw: prev?.lastScore.rw ?? null,
    math: prev?.lastScore.math ?? null,
    target: prev?.targetScore ?? 1400,
    universities: prev?.goals ?? "",
    reason: prev?.reason ?? "",
    testDate: prev ? prev.testDate : toISODate(addDays(parseISODate(today), 90)),
    hours: prev ? Math.max(0.5, prev.sessionMinutes / 60) : 1.5,
    studyDays: prev?.studyDays ?? [0, 1, 2, 3, 4, 5],
    weak,
  };
}

const validScore = (n: number | null) => n !== null && n >= 200 && n <= 800;

export function validateOnboarding(step: number, d: OnboardingDraft, today: string): OnboardingError | null {
  if (step === 0 && d.phone && d.phone.replace(/\D/g, "").length < 9) return "phone";
  if (step === 1 && d.taken && (!validScore(d.rw) || !validScore(d.math))) return "score";
  if (step === 3 && d.testDate && d.testDate <= today) return "testDate";
  if (step === 3 && d.studyDays.length === 0) return "days";
  return null;
}

/** Joriy ball: SAT topshirgan bo'lsa — kiritilgani, aks holda `null` */
export const currentScore = (d: OnboardingDraft) => (d.taken && d.rw && d.math ? d.rw + d.math : null);

function levelOf(d: OnboardingDraft): Level {
  const score = currentScore(d);
  if (score !== null) return score >= 1300 ? "advanced" : score >= 1000 ? "intermediate" : "beginner";
  return d.englishLevel === "C1" || d.englishLevel === "C2" ? "intermediate" : "beginner";
}

/** So'rovnoma → mavjud profil modeli (dashboard'dagi reja shu profil asosida tuziladi). */
export function onboardingToProfile(
  d: OnboardingDraft,
  account: { name: string; email: string },
  today: string,
  prev?: StudentProfile | null,
): StudentProfile {
  const level = levelOf(d);
  const base = { beginner: 2, intermediate: 3, advanced: 4 }[level];
  // Zaif deb belgilangan mavzular — pastroq baho, reja ularga ko'proq vaqt ajratadi
  const domainRatings = Object.fromEntries(
    ALL_DOMAINS.map((id) => [id, (d.weak.includes(id) ? Math.max(1, base - 1) : base) as Rating]),
  ) as Record<DomainId, Rating>;

  return {
    fullName: account.name,
    email: account.email,
    phone: d.phone.trim(),
    city: d.city.trim(),
    grade: d.grade,
    level,
    englishLevel: d.englishLevel,
    scoreSource: d.taken ? "sat" : "none",
    lastScore: d.taken ? { rw: d.rw, math: d.math } : { rw: null, math: null },
    domainRatings,
    targetScore: d.target,
    testDate: d.testDate,
    studyDays: [...d.studyDays].sort(),
    sessionMinutes: Math.round(d.hours * 60),
    goals: d.universities.trim(),
    reason: d.reason.trim(),
    planStartDate: today,
    createdAt: prev?.createdAt ?? new Date().toISOString(),
  };
}
