import type { DomainId } from "@/entities/sat";
import type { Rating, StudentProfile } from "@/entities/student";

export type Draft = Omit<StudentProfile, "planStartDate" | "createdAt">;

const defaultRatings = {
  "craft-structure": 3,
  "information-ideas": 3,
  conventions: 3,
  "expression-ideas": 3,
  algebra: 3,
  "advanced-math": 3,
  "data-analysis": 3,
  "geometry-trig": 3,
} satisfies Record<DomainId, Rating>;

export function createDraft(profile: StudentProfile | null): Draft {
  if (profile) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { planStartDate, createdAt, ...rest } = profile;
    return rest;
  }
  return {
    fullName: "",
    email: "",
    phone: "",
    grade: "11",
    level: "intermediate",
    englishLevel: "B2",
    scoreSource: "none",
    lastScore: { rw: null, math: null },
    domainRatings: { ...defaultRatings },
    targetScore: 1400,
    testDate: null,
    studyDays: [0, 2, 4, 5],
    sessionMinutes: 60,
    goals: "",
  };
}

export const steps = ["profile", "level", "skills", "goal", "schedule", "review"] as const;

export type ValidationError = "name" | "email" | "phone" | "score" | "testDate" | "days";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validScore(n: number | null) {
  return n !== null && n >= 200 && n <= 800;
}

/** Xato kalitini qaytaradi (matn lug'atda), yoki `null`. */
export function validateStep(step: number, draft: Draft, minTestDate: string): ValidationError | null {
  switch (step) {
    case 0:
      if (draft.fullName.trim().length < 2) return "name";
      if (!EMAIL_RE.test(draft.email.trim())) return "email";
      if (draft.phone && draft.phone.replace(/\D/g, "").length < 9) return "phone";
      return null;
    case 1:
      if (draft.scoreSource !== "none" && (!validScore(draft.lastScore.rw) || !validScore(draft.lastScore.math)))
        return "score";
      return null;
    case 3:
      if (draft.testDate && draft.testDate < minTestDate) return "testDate";
      return null;
    case 4:
      if (draft.studyDays.length === 0) return "days";
      return null;
    default:
      return null;
  }
}
