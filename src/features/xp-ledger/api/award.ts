import "server-only";

import { dedupeKey, xpFor, type XpClaim } from "@/entities/gamification";
import {
  FINAL_TEST_ID,
  SIMULATION_ID,
  chooseAdaptivePath,
  dailyQuestionFor,
  getPracticeTest,
  getQuestion,
  isCorrect,
  moduleTwoQuestions,
  type AnswerValue,
  type Question,
} from "@/entities/practice-test";
import { getListeningLesson } from "@/entities/skill";
import { vocabWords } from "@/entities/vocab";
import { alreadyMastered, recordXp, refreshTestStats, tashkentDay, type XpEvent } from "@/shared/server";

import { ensureCertificates } from "./certificates";

export const MAX_CLAIMS = 60;

const ID_RE = /^[\w.:-]{4,100}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const shift = (days: number) => tashkentDay(new Date(Date.now() + days * 86_400_000));

const isAnswer = (v: unknown): v is AnswerValue =>
  v === null || (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 3) || (typeof v === "string" && v.length <= 12);

const sameIds = (a: string[], b: { id: string }[]) => a.length === b.length && b.every((q, i) => q.id === a[i]);

/** Test haqiqatan shu savollardan iboratmi; yaroqsiz bo'lsa `null` */
function testQuestions(testId: string, ids: string[], answers: AnswerValue[]): Question[] | null {
  const test = getPracticeTest(testId);
  if (!test) return null;
  const questions = ids.map(getQuestion);
  if (questions.some((q) => !q) || new Set(ids).size !== ids.length) return null;
  const list = questions as Question[];

  // Simulyator savollarni tasodifiy yig'adi: ikkala bo'lim, har birida 7 + 6 tagacha
  if (testId === SIMULATION_ID) {
    const rw = list.filter((q) => q.sectionId === "rw").length;
    return rw >= 7 && rw <= 13 && list.length - rw >= 7 && list.length - rw <= 13 ? list : null;
  }
  const first = test.questionIds.map((id) => ({ id }));
  if (sameIds(ids, first)) return list;
  if (!test.adaptive) return null;
  const path = chooseAdaptivePath(test, answers.slice(0, first.length));
  return sameIds(ids, [...first, ...moduleTwoQuestions(test, path)]) ? list : null;
}

/** So'rovni tekshirib, XP hodisasiga aylantiradi. Yaroqsiz bo'lsa `null`. */
async function grade(userId: string, claim: XpClaim): Promise<XpEvent | null> {
  if (!claim || typeof claim !== "object" || typeof claim.id !== "string" || !ID_RE.test(claim.id)) return null;
  const today = shift(0);
  // Internetsiz ishlangan kechagi natija kechagi kunga yoziladi; undan eskisi/kelajak — bugunga
  const day = claim.day === shift(-1) ? claim.day : today;
  const base = { eventId: claim.id, day };

  switch (claim.type) {
    case "test": {
      if (!Array.isArray(claim.questionIds) || !Array.isArray(claim.answers)) return null;
      const { questionIds: ids, answers } = claim;
      if (!ids.length || ids.length > 40 || ids.length !== answers.length) return null;
      if (!ids.every((id) => typeof id === "string") || !answers.every(isAnswer)) return null;
      const list = testQuestions(String(claim.testId), ids, answers);
      // Hech narsa belgilanmagan test XP bermaydi
      if (!list || answers.every((a) => a === null || a === "")) return null;
      const detail: Record<string, [number, number]> = {};
      let correct = 0;
      list.forEach((q, i) => {
        const ok = isCorrect(q, answers[i]);
        const d = (detail[q.domainId] ??= [0, 0]);
        d[1]++;
        if (ok) {
          d[0]++;
          correct++;
        }
      });
      const total = list.length;
      return { ...base, kind: "test", ref: claim.testId, dedupe: null, xp: xpFor({ type: "test", correct, total }), correct, total, detail };
    }
    case "daily": {
      if (typeof claim.date !== "string" || !DAY_RE.test(claim.date) || !isAnswer(claim.choice) || claim.choice === null) return null;
      // Faqat bugungi yoki kechagi kunlik savol
      if (claim.date !== today && claim.date !== shift(-1)) return null;
      const question = dailyQuestionFor(claim.date);
      const correct = isCorrect(question, claim.choice);
      return {
        ...base,
        kind: "daily",
        ref: claim.date,
        dedupe: dedupeKey(claim, day),
        xp: xpFor({ type: "daily", date: claim.date, questionId: question.id, choice: claim.choice, correct }),
        correct: correct ? 1 : 0,
        total: 1,
      };
    }
    case "practice":
    case "review": {
      const question = getQuestion(String(claim.questionId));
      if (!question || !isAnswer(claim.answer) || claim.answer === null || claim.answer === "") return null;
      const correct = isCorrect(question, claim.answer);
      const common = { ...base, ref: question.id, dedupe: dedupeKey(claim, day), correct: correct ? 1 : 0, total: 1 };
      if (claim.type === "practice") return { ...common, kind: "practice", xp: xpFor({ type: "practice", correct }) };
      // O'zlashtirish bonusi har savol uchun bir marta
      const mastered = claim.mastered === true && correct && !(await alreadyMastered(userId, question.id));
      return { ...common, kind: "review", mastered, xp: xpFor({ type: "review", correct, mastered }) };
    }
    case "word": {
      if (claim.choice !== claim.word || !vocabWords.some((w) => w.word === claim.word)) return null;
      return { ...base, kind: "word", ref: claim.word, dedupe: dedupeKey(claim, day), xp: xpFor({ type: "word" }) };
    }
    case "listening": {
      const lesson = getListeningLesson(String(claim.lessonId));
      const answers = claim.answers;
      if (!lesson || !Array.isArray(answers) || answers.length !== lesson.questions.length || !answers.every(isAnswer)) return null;
      if (answers.every((a) => a === null)) return null;
      const correct = lesson.questions.filter((q, i) => answers[i] === q.answer).length;
      const total = lesson.questions.length;
      return { ...base, kind: "listening", ref: lesson.id, dedupe: dedupeKey(claim, day), xp: xpFor({ type: "listening", correct, total }), correct, total };
    }
    default:
      return null;
  }
}

/** Javoblarni tekshirib, XP beradi. Takror va yaroqsiz so'rovlar 0 XP bilan qaytadi (qurilma navbatidan o'chishi uchun). */
export async function awardXp(userId: string, claims: XpClaim[]) {
  const results: { id: string; xp: number }[] = [];
  let hasTest = false;
  let hasFinal = false;
  for (const claim of claims.slice(0, MAX_CLAIMS)) {
    const event = await grade(userId, claim);
    if (!event) {
      results.push({ id: String(claim?.id ?? ""), xp: 0 });
      continue;
    }
    const { awarded } = await recordXp(userId, event);
    results.push({ id: event.eventId, xp: awarded });
    hasTest ||= event.kind === "test";
    hasFinal ||= event.kind === "test" && event.ref === FINAL_TEST_ID;
  }
  if (hasTest) await refreshTestStats(userId);
  // Xato bo'lsa ham XP javobi to'xtamaydi — sertifikat sahifasi ochilganda qayta uriniladi
  if (hasFinal) await ensureCertificates(userId).catch((error) => console.error("[certificate]", error));
  return results;
}
