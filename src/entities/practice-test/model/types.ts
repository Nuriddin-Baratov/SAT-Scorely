import type { DomainId, SectionId } from "@/entities/sat/@x/practice-test";
import type { Localized } from "@/shared/i18n";

/** Tanlangan variant indeksi (test) yoki yozilgan javob (SPR), javobsiz — `null` */
export type AnswerValue = number | string | null;

interface QuestionBase {
  id: string;
  sectionId: SectionId;
  domainId: DomainId;
  difficulty: "easy" | "medium" | "hard";
  /** Matn (faqat R&W savollarida) — ingliz tilida, xuddi SAT'dagidek */
  passage?: string;
  prompt: string;
  explanation: Localized;
}

/** 4 variantli test savoli */
export interface ChoiceQuestion extends QuestionBase {
  format?: "mcq";
  choices: [string, string, string, string];
  /** To'g'ri variant indeksi (0–3) */
  answer: 0 | 1 | 2 | 3;
}

/** Javobni o'zi yozadigan savol (Student-Produced Response) */
export interface SprQuestion extends QuestionBase {
  format: "spr";
  /** Qabul qilinadigan javoblar: "7", "1/2", "0.5" … (qiymati teng bo'lsa ham qabul qilinadi) */
  accepted: string[];
}

export type Question = ChoiceQuestion | SprQuestion;

export interface PracticeTest {
  id: string;
  kind: SectionId | "mixed";
  title: Localized;
  description: Localized;
  minutes: number;
  /** Oddiy test savollari; adaptiv testda — 1-modul */
  questionIds: string[];
  /** Adaptiv test: 1-modul natijasiga ko'ra 2-modul tanlanadi */
  adaptive?: {
    /** Qiyin modulga o'tish uchun kerakli to'g'ri javoblar soni */
    threshold: number;
    easy: string[];
    hard: string[];
  };
  /** To'liq imtihon simulyatori (alohida sahifada ishlanadi) */
  simulation?: boolean;
}

export type AdaptivePath = "easy" | "hard";

export interface TestAttempt {
  id: string;
  testId: string;
  /** ISO vaqt */
  finishedAt: string;
  durationSec: number;
  /** Har bir savolga javob */
  answers: AnswerValue[];
  /** Haqiqatda berilgan savollar (adaptiv testda yo'lga bog'liq) */
  questionIds?: string[];
  path?: AdaptivePath;
  /** Simulyatorda har bir bo'lim uchun alohida yo'l */
  paths?: Partial<Record<SectionId, AdaptivePath>>;
  /** Har bir savolga sarflangan vaqt (soniya) */
  times?: number[];
}
