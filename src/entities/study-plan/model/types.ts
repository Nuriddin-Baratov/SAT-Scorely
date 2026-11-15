import type { DomainId, SectionId } from "@/entities/sat/@x/study-plan";

export type PhaseId = "foundation" | "growth" | "test-practice" | "final";
export type SessionKind = "diagnostic" | "lesson" | "module-test" | "practice-test" | "review" | "test-prep";
export type Difficulty = "easy" | "medium" | "hard" | "mixed";
export type Feasibility = "realistic" | "ambitious" | "stretch";

export interface SessionBlock {
  label: string;
  minutes: number;
  detail: string;
}

export interface PlanSession {
  id: string;
  date: string;
  weekIndex: number;
  phase: PhaseId;
  kind: SessionKind;
  section: SectionId | "full";
  skillId: string | null;
  domainId: DomainId | null;
  title: string;
  subtitle: string;
  minutes: number;
  difficulty: Difficulty;
  questions: number;
  blocks: SessionBlock[];
}

export interface PlanWeek {
  index: number;
  start: string;
  end: string;
  phase: PhaseId;
  sessions: PlanSession[];
  focus: string[];
}

export interface PlanPhase {
  id: PhaseId;
  name: string;
  description: string;
  fromWeek: number;
  toWeek: number;
}

export interface DomainFocus {
  domainId: DomainId;
  sectionId: SectionId;
  name: string;
  share: number;
  rating: number;
  lessons: number;
}

export interface ScoreTriple {
  rw: number;
  math: number;
  total: number;
}

export interface StudyPlan {
  startDate: string;
  endDate: string;
  testDate: string | null;
  weeks: PlanWeek[];
  sessions: PlanSession[];
  phases: PlanPhase[];
  baseline: ScoreTriple;
  target: ScoreTriple;
  gap: number;
  expectedGain: number;
  feasibility: Feasibility;
  extraSessionsPerWeek: number;
  /** Maqsad uchun vaqt juda kam — test sanasini surish tavsiya etiladi */
  suggestLaterDate: boolean;
  totalHours: number;
  weeklyHours: number;
  practiceTests: number;
  domainFocus: DomainFocus[];
}
