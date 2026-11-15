export type SectionId = "rw" | "math";

export type DomainId =
  | "craft-structure"
  | "information-ideas"
  | "conventions"
  | "expression-ideas"
  | "algebra"
  | "advanced-math"
  | "data-analysis"
  | "geometry-trig";

export interface Skill {
  id: string;
  domainId: DomainId;
  /** College Board'dagi rasmiy nomi */
  name: string;
  nameUz: string;
  /** 1 — poydevor, 3 — murakkab */
  tier: 1 | 2 | 3;
  summary: string;
  strategies: string[];
  traps: string[];
}

export interface Domain {
  id: DomainId;
  sectionId: SectionId;
  name: string;
  nameUz: string;
  /** Bo'lim ichidagi ulushi (0–1) */
  weight: number;
  questions: string;
  description: string;
  skills: Skill[];
}

export interface Section {
  id: SectionId;
  name: string;
  nameUz: string;
  questions: number;
  minutes: number;
  modules: { questions: number; minutes: number };
  description: string;
  highlights: string[];
}
