export type {
  Difficulty,
  DomainFocus,
  Feasibility,
  PhaseId,
  PlanPhase,
  PlanSession,
  PlanWeek,
  ScoreTriple,
  SessionBlock,
  SessionKind,
  StudyPlan,
} from "./model/types";
export type { DomainAccuracy } from "./model/generate-plan";
export { estimateBaseline, generateStudyPlan, getSessionSkill, phaseMetaFor } from "./model/generate-plan";
export {
  computeProgress,
  currentWeekIndex,
  findNextSession,
  progressRepository,
  useCompletedSessions,
} from "./model/progress";
export { SessionKindIcon, difficultyLabels, sessionKindLabels } from "./ui/session-kind";
