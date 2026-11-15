import type { DomainId } from "@/entities/sat/@x/student";

export type Level = "beginner" | "intermediate" | "advanced";
export type ScoreSource = "none" | "sat" | "psat" | "practice";
export type EnglishLevel = "A2" | "B1" | "B2" | "C1" | "C2";
export type Grade = "8" | "9" | "10" | "11" | "12" | "graduate";
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface StudentProfile {
  fullName: string;
  email: string;
  phone: string;
  grade: Grade;
  level: Level;
  englishLevel: EnglishLevel;
  scoreSource: ScoreSource;
  lastScore: { rw: number | null; math: number | null };
  domainRatings: Record<DomainId, Rating>;
  targetScore: number;
  /** `YYYY-MM-DD` yoki hali noma'lum */
  testDate: string | null;
  /** 0 = Dushanba … 6 = Yakshanba */
  studyDays: number[];
  sessionMinutes: number;
  goals: string;
  /** Reja shu kundan boshlab tuziladi (`YYYY-MM-DD`) */
  planStartDate: string;
  createdAt: string;
}
