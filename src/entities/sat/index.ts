export type { Domain, DomainId, Section, SectionId, Skill } from "./model/types";
export {
  domains,
  getDomain,
  getDomainsBySection,
  getSkill,
  sections,
  totalSkills,
} from "./model/curriculum";
export { faq, satTimeline, scoreBands, strategies, testDayChecklist } from "./model/facts";
export {
  estimatePercentile,
  requiredAccuracy,
  scaleSection,
  scoreBandOf,
  sectionQuestionCount,
  type ScoreBandId,
} from "./model/scoring";
export { getSatFacts } from "./model/facts-i18n";
export { domainDescription, localizeSection, localizeSkill, type LocalizedSkill } from "./model/localize";
