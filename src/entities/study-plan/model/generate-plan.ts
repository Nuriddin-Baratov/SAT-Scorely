import { domains, getSkill, localizeSkill, type DomainId, type SectionId, type Skill } from "@/entities/sat/@x/study-plan";
import type { StudentProfile } from "@/entities/student/@x/study-plan";
import { getDictionary, type Locale } from "@/shared/i18n";
import { addDays, daysBetween, parseISODate, toISODate, weekdayIndex } from "@/shared/lib";

import { planTexts } from "./texts";
import type {
  Difficulty,
  DomainFocus,
  Feasibility,
  PhaseId,
  PlanPhase,
  PlanSession,
  PlanWeek,
  ScoreTriple,
  StudyPlan,
} from "./types";

const MAX_WEEKS = 52;
const FULL_TEST_MINUTES = 144; // 134 daqiqa test + 10 daqiqa tanaffus
const MODULE_MINUTES: Record<SectionId, number> = { rw: 32, math: 35 };
const SECONDS_PER_QUESTION: Record<SectionId, number> = { rw: 71, math: 95 };

/** Bosqich nomi va tavsifi tanlangan tilda */
export function phaseMetaFor(locale: Locale) {
  return planTexts(locale).phases;
}

const round10 = (n: number) => Math.round(n / 10) * 10;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function sectionRating(profile: StudentProfile, sectionId: SectionId) {
  const list = domains.filter((d) => d.sectionId === sectionId);
  const weight = list.reduce((sum, d) => sum + d.weight, 0);
  return list.reduce((sum, d) => sum + d.weight * profile.domainRatings[d.id], 0) / weight;
}

export function estimateBaseline(profile: StudentProfile): ScoreTriple {
  const levelShift = profile.level === "beginner" ? -20 : profile.level === "advanced" ? 30 : 0;
  const fromRatings = (id: SectionId) => round10(clamp(330 + (sectionRating(profile, id) - 1) * 95 + levelShift, 200, 800));
  const known = profile.scoreSource !== "none";
  const rw = known && profile.lastScore.rw ? round10(clamp(profile.lastScore.rw, 200, 800)) : fromRatings("rw");
  const math = known && profile.lastScore.math ? round10(clamp(profile.lastScore.math, 200, 800)) : fromRatings("math");
  return { rw, math, total: rw + math };
}

function splitTarget(baseline: ScoreTriple, targetTotal: number): ScoreTriple {
  const total = clamp(round10(targetTotal), 400, 1600);
  const gap = total - baseline.total;
  if (gap <= 0) return { ...baseline };
  const roomRw = 800 - baseline.rw;
  const roomMath = 800 - baseline.math;
  const rw = Math.min(800, round10(baseline.rw + (gap * roomRw) / Math.max(1, roomRw + roomMath)));
  const math = clamp(total - rw, baseline.math, 800);
  return { rw, math, total: rw + math };
}

/** O'rtacha o'sish (ball / sifatli o'quv soati) — boshlang'ich darajada tezroq. */
function gainRate(total: number) {
  if (total < 900) return 4.5;
  if (total < 1100) return 3.5;
  if (total < 1300) return 2.5;
  if (total < 1450) return 1.6;
  return 0.9;
}

function phaseForWeek(week: number, weekCount: number): PhaseId {
  const finalWeeks = weekCount >= 2 ? 1 : 0;
  const core = weekCount - finalWeeks;
  if (week >= core) return "final";
  const foundationEnd = Math.max(1, Math.round(core * 0.4));
  const growthEnd = foundationEnd + Math.max(1, Math.round(core * 0.35));
  if (week < foundationEnd) return "foundation";
  if (week < growthEnd) return "growth";
  return "test-practice";
}

function difficultyFor(phase: PhaseId, rating: number): Difficulty {
  if (phase === "foundation") return rating <= 2 ? "easy" : "medium";
  if (phase === "growth") return rating <= 2 ? "medium" : "hard";
  if (phase === "test-practice") return rating >= 3 ? "hard" : "mixed";
  return "mixed";
}

interface Slot {
  date: string;
  weekIndex: number;
}

/**
 * Test natijalari: domen → aniqlik (0–1). Kamida bir nechta savol bo'lgan domenlargina beriladi.
 * Aniqlik past bo'lsa — rejada shu domenga ko'proq dars, yuqori bo'lsa — kamroq.
 */
export type DomainAccuracy = Partial<Record<DomainId, number>>;

export function generateStudyPlan(
  profile: StudentProfile,
  locale: Locale = "uz",
  performance: DomainAccuracy = {},
): StudyPlan {
  const tx = planTexts(locale);
  const domainNames = getDictionary(locale).domains;
  const baseline = estimateBaseline(profile);
  const target = splitTarget(baseline, profile.targetScore);
  const gap = Math.max(0, target.total - baseline.total);
  const minutes = profile.sessionMinutes;
  const lowEnglish = profile.englishLevel === "A2" || profile.englishLevel === "B1";

  // ---- Kalendar oralig'i ----
  const start = parseISODate(profile.planStartDate);
  const test = profile.testDate ? parseISODate(profile.testDate) : null;
  let lastDay: Date;
  if (test && daysBetween(start, test) >= 2) {
    lastDay = addDays(test, -1);
  } else {
    const defaultWeeks = gap <= 80 ? 8 : gap <= 180 ? 12 : 16;
    lastDay = addDays(start, defaultWeeks * 7 - 1);
  }
  if (daysBetween(start, lastDay) > MAX_WEEKS * 7 - 1) lastDay = addDays(start, MAX_WEEKS * 7 - 1);
  const totalDays = daysBetween(start, lastDay) + 1;
  const weekCount = Math.max(1, Math.ceil(totalDays / 7));

  const studyDays = new Set(profile.studyDays.length ? profile.studyDays : [0, 2, 4]);
  const slots: Slot[] = [];
  for (let d = 0; d < totalDays; d++) {
    const date = addDays(start, d);
    if (studyDays.has(weekdayIndex(date))) slots.push({ date: toISODate(date), weekIndex: Math.floor(d / 7) });
  }

  // ---- Domenlar ustuvorligi ----
  const sectionGap: Record<SectionId, number> = {
    rw: target.rw - baseline.rw,
    math: target.math - baseline.math,
  };
  const weights = new Map<DomainId, number>();
  for (const domain of domains) {
    const rating = profile.domainRatings[domain.id];
    let w = domain.weight * Math.pow(6 - rating, 1.4) * (1 + sectionGap[domain.sectionId] / 150);
    if (lowEnglish && (domain.id === "craft-structure" || domain.id === "information-ideas")) w *= 1.2;
    const accuracy = performance[domain.id];
    // 75% — neytral nuqta: undan past bo'lsa vazn oshadi (≤1.6×), yuqori bo'lsa kamayadi (≥0.6×).
    if (accuracy !== undefined) w *= clamp(1 + (0.75 - accuracy) * 1.6, 0.6, 1.6);
    weights.set(domain.id, w);
  }
  const weightSum = [...weights.values()].reduce((a, b) => a + b, 0);

  const credit = new Map<DomainId, number>(domains.map((d) => [d.id, 0]));
  const skillCursor = new Map<DomainId, number>();
  const sortedSkills = new Map<DomainId, Skill[]>(
    domains.map((d) => [d.id, [...d.skills].sort((a, b) => a.tier - b.tier)]),
  );
  for (const domain of domains) {
    const list = sortedSkills.get(domain.id)!;
    const strong = profile.domainRatings[domain.id] >= 4;
    skillCursor.set(domain.id, strong ? Math.max(0, list.findIndex((s) => s.tier >= 2)) : 0);
  }
  const lessonCount = new Map<DomainId, number>(domains.map((d) => [d.id, 0]));

  function nextSkill(): Skill {
    for (const [id, w] of weights) credit.set(id, credit.get(id)! + w / weightSum);
    let best: DomainId = domains[0].id;
    for (const [id, c] of credit) if (c > credit.get(best)!) best = id;
    credit.set(best, credit.get(best)! - 1);
    const list = sortedSkills.get(best)!;
    const cursor = skillCursor.get(best)!;
    skillCursor.set(best, cursor + 1);
    lessonCount.set(best, lessonCount.get(best)! + 1);
    return list[cursor % list.length];
  }

  function lessonSession(slot: Slot, index: number, phase: PhaseId, kind: "lesson" | "review"): PlanSession {
    const skill = localizeSkill(nextSkill(), locale);
    const section = domains.find((d) => d.id === skill.domainId)!.sectionId;
    const rating = profile.domainRatings[skill.domainId];
    const difficulty: Difficulty = kind === "review" ? "mixed" : difficultyFor(phase, rating);
    const timed = phase === "test-practice" || phase === "final";
    const warm = Math.max(5, Math.round(minutes * 0.1));
    const theory = Math.round(minutes * (kind === "review" ? 0.15 : timed ? 0.2 : 0.3));
    const review = Math.max(5, Math.round(minutes * 0.15));
    const practice = Math.max(5, minutes - warm - theory - review);
    const pace = (SECONDS_PER_QUESTION[section] / 60) * (timed ? 1 : 1.35);
    const questions = Math.max(4, Math.floor(practice / pace));

    const vocab = section === "rw" && lowEnglish ? tx.vocab : "";
    return {
      id: `${slot.date}-${index}`,
      date: slot.date,
      weekIndex: slot.weekIndex,
      phase,
      kind,
      section,
      skillId: skill.id,
      domainId: skill.domainId,
      title: kind === "review" ? `${tx.reviewPrefix}: ${skill.displayName}` : skill.displayName,
      subtitle: `${skill.name} · ${tx.depth[phase]}`,
      minutes,
      difficulty,
      questions,
      blocks: [
        { label: tx.blocks.warmup, minutes: warm, detail: `${tx.blocks.warmupDetail}${vocab}` },
        { label: kind === "review" ? tx.blocks.recall : tx.blocks.theory, minutes: theory, detail: skill.summary },
        {
          label: tx.blocks.practice,
          minutes: practice,
          detail: tx.blocks.practiceDetail(questions, tx.difficulty[difficulty], timed, Math.round(SECONDS_PER_QUESTION[section])),
        },
        { label: tx.blocks.mistakes, minutes: review, detail: tx.blocks.mistakesDetail },
      ],
    };
  }

  function testSession(slot: Slot, index: number, phase: PhaseId, kind: "diagnostic" | "practice-test", title: string): PlanSession {
    return {
      id: `${slot.date}-${index}`,
      date: slot.date,
      weekIndex: slot.weekIndex,
      phase,
      kind,
      section: "full",
      skillId: null,
      domainId: null,
      title,
      subtitle: tx.titles.fullSubtitle,
      minutes: FULL_TEST_MINUTES,
      difficulty: "mixed",
      questions: 98,
      blocks: tx.blocks.fullTest.map((b) => ({ ...b })),
    };
  }

  let moduleToggle: SectionId = sectionGap.math >= sectionGap.rw ? "math" : "rw";
  function moduleSession(slot: Slot, index: number, phase: PhaseId): PlanSession {
    const section = moduleToggle;
    moduleToggle = moduleToggle === "math" ? "rw" : "math";
    const moduleMin = MODULE_MINUTES[section];
    const total = Math.max(minutes, moduleMin + 15);
    return {
      id: `${slot.date}-${index}`,
      date: slot.date,
      weekIndex: slot.weekIndex,
      phase,
      kind: "module-test",
      section,
      skillId: null,
      domainId: null,
      title: tx.titles.moduleTest(section),
      subtitle: tx.titles.moduleSubtitle,
      minutes: total,
      difficulty: "mixed",
      questions: section === "math" ? 22 : 27,
      blocks: [
        { label: tx.blocks.module, minutes: moduleMin, detail: tx.blocks.moduleDetail(section === "math" ? 22 : 27) },
        { label: tx.blocks.analysis, minutes: total - moduleMin, detail: tx.blocks.analysisDetail },
      ],
    };
  }

  function prepSession(slot: Slot, index: number): PlanSession {
    const m = Math.min(minutes, 45);
    return {
      id: `${slot.date}-${index}`,
      date: slot.date,
      weekIndex: slot.weekIndex,
      phase: "final",
      kind: "test-prep",
      section: "full",
      skillId: null,
      domainId: null,
      title: tx.titles.prep,
      subtitle: tx.titles.prepSubtitle,
      minutes: m,
      difficulty: "easy",
      questions: 10,
      blocks: [
        { label: tx.blocks.notebook, minutes: Math.round(m * 0.5), detail: tx.blocks.notebookDetail },
        { label: tx.blocks.logistics, minutes: Math.round(m * 0.25), detail: tx.blocks.logisticsDetail },
        { label: tx.blocks.rest, minutes: m - Math.round(m * 0.5) - Math.round(m * 0.25), detail: tx.blocks.restDetail },
      ],
    };
  }

  // ---- Sessiyalarni yig'ish ----
  const byWeek = new Map<number, Slot[]>();
  for (const slot of slots) {
    if (!byWeek.has(slot.weekIndex)) byWeek.set(slot.weekIndex, []);
    byWeek.get(slot.weekIndex)!.push(slot);
  }

  const sessions: PlanSession[] = [];
  let slotIndex = 0;
  let growthWeek = 0;
  let testPracticeWeek = 0;

  for (let w = 0; w < weekCount; w++) {
    const phase = phaseForWeek(w, weekCount);
    const weekSlots = byWeek.get(w) ?? [];
    const n = weekSlots.length;
    weekSlots.forEach((slot, i) => {
      const idx = slotIndex++;
      if (test && idx > 0 && idx === slots.length - 1) {
        // Testdan oldingi oxirgi mashg'ulot har doim yengil tayyorgarlik.
        sessions.push(prepSession(slot, idx));
        return;
      }
      if (idx === 0) {
        sessions.push(testSession(slot, idx, phase, "diagnostic", tx.titles.diagnostic));
        return;
      }
      if (phase === "growth" && growthWeek % 2 === 1 && n >= 2 && i === n - 1) {
        sessions.push(moduleSession(slot, idx, phase));
        return;
      }
      if (phase === "test-practice" && i === 0 && (n >= 2 || testPracticeWeek % 2 === 0)) {
        sessions.push(testSession(slot, idx, phase, "practice-test", tx.titles.practiceTest));
        return;
      }
      if (phase === "final") {
        const isLast = i === n - 1;
        if (isLast && test) {
          sessions.push(prepSession(slot, idx));
          return;
        }
        if (isLast && !test) {
          sessions.push(testSession(slot, idx, phase, "practice-test", tx.titles.finalTest));
          return;
        }
        if (i === 0 && n >= 3) {
          sessions.push(testSession(slot, idx, phase, "practice-test", tx.titles.lastTest));
          return;
        }
        sessions.push(lessonSession(slot, idx, phase, "review"));
        return;
      }
      sessions.push(lessonSession(slot, idx, phase, "lesson"));
    });
    if (phase === "growth") growthWeek++;
    if (phase === "test-practice") testPracticeWeek++;
  }

  // ---- Haftalar va bosqichlar ----
  const weeks: PlanWeek[] = [];
  for (let w = 0; w < weekCount; w++) {
    const weekSessions = sessions.filter((s) => s.weekIndex === w);
    const focusCount = new Map<string, number>();
    for (const s of weekSessions) {
      if (!s.domainId) continue;
      const name = domainNames[s.domainId];
      focusCount.set(name, (focusCount.get(name) ?? 0) + 1);
    }
    weeks.push({
      index: w,
      start: toISODate(addDays(start, w * 7)),
      end: toISODate(addDays(start, Math.min(w * 7 + 6, totalDays - 1))),
      phase: phaseForWeek(w, weekCount),
      sessions: weekSessions,
      focus: [...focusCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([name]) => name),
    });
  }

  const phases: PlanPhase[] = [];
  for (const week of weeks) {
    const last = phases[phases.length - 1];
    if (last && last.id === week.phase) last.toWeek = week.index;
    else phases.push({ id: week.phase, ...tx.phases[week.phase], fromWeek: week.index, toWeek: week.index });
  }

  // ---- Natija prognozi ----
  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const rate = gainRate(baseline.total);
  const expectedGain = Math.min(round10(totalHours * rate), 1600 - baseline.total);
  let feasibility: Feasibility = "realistic";
  if (expectedGain < gap) feasibility = expectedGain >= gap * 0.7 ? "ambitious" : "stretch";
  let extraSessionsPerWeek = 0;
  let suggestLaterDate = false;
  if (expectedGain < gap) {
    const deficitHours = gap / rate - totalHours;
    const needed = Math.ceil(deficitHours / weekCount / (minutes / 60));
    const freeDays = 7 - studyDays.size;
    // Haftaga qo'shib bo'lmaydigan darajada ko'p bo'lsa — sanani surishni tavsiya qilamiz.
    suggestLaterDate = needed > Math.min(3, freeDays);
    extraSessionsPerWeek = Math.min(needed, Math.min(3, freeDays));
  }

  const domainFocus: DomainFocus[] = domains
    .map((d) => ({
      domainId: d.id,
      sectionId: d.sectionId,
      name: domainNames[d.id],
      share: weights.get(d.id)! / weightSum,
      rating: profile.domainRatings[d.id],
      lessons: sessions.filter((s) => s.domainId === d.id).length,
    }))
    .sort((a, b) => b.share - a.share);

  return {
    startDate: profile.planStartDate,
    endDate: toISODate(lastDay),
    testDate: profile.testDate,
    weeks,
    sessions,
    phases,
    baseline,
    target,
    gap,
    expectedGain,
    feasibility,
    extraSessionsPerWeek,
    suggestLaterDate,
    totalHours,
    weeklyHours: Math.round((totalHours / weekCount) * 10) / 10,
    practiceTests: sessions.filter((s) => s.kind === "diagnostic" || s.kind === "practice-test").length,
    domainFocus,
  };
}

export function getSessionSkill(session: PlanSession, locale: Locale = "uz") {
  const skill = session.skillId ? getSkill(session.skillId) : undefined;
  return skill ? localizeSkill(skill, locale) : null;
}
