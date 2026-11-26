"use client";

import { useMemo, useState, type ReactNode } from "react";

import { gameRepository } from "@/entities/gamification";
import { dueMistakes, mistakesRepository, useMistakes } from "@/entities/mistake";
import { QuestionCard, QuestionDrill, getPracticeTest, getQuestion, pickQuestions, type Question } from "@/entities/practice-test";
import { getSatFacts } from "@/entities/sat";
import { getSessionSkill, progressRepository, sessionKindLabels, SessionKindIcon, type PlanSession } from "@/entities/study-plan";
import { Simulator, TestRunner } from "@/features/take-test";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { useToday } from "@/shared/lib/react";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card } from "@/shared/ui/primitives";

/** Modul testi uchun bo'limdagi tayyor (server tekshiradigan) testlar — mashg'ulotlar navbat bilan oladi */
const MODULE_TESTS = { rw: ["rw-diagnostic", "rw-advanced"], math: ["math-diagnostic", "math-challenge", "math-adaptive"] } as const;

type Answered = { question: Question; correct: boolean };

/**
 * Mashg'ulotni haqiqatda o'tkazish: turiga qarab — dars (4 qadam), modul testi, to'liq simulyator
 * yoki imtihon oldi tayyorgarlik. Oxirida mashg'ulot o'zi "bajarildi" bo'ladi.
 */
export function SessionPlayer({ session, next }: { session: PlanSession; next: PlanSession | null }) {
  const { t, locale, href } = useI18n();
  const s = t.session;
  const [finished, setFinished] = useState<{ correct?: number; total?: number } | null>(null);

  function finish(result: { correct?: number; total?: number } = {}) {
    progressRepository.complete(session.id);
    setFinished(result);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const header = (
    <div className="flex items-center gap-3">
      <SessionKindIcon kind={session.kind} className="size-11 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-accent uppercase">{sessionKindLabels(locale)[session.kind]}</p>
        <h1 className="truncate text-lg font-bold sm:text-2xl">{session.title}</h1>
      </div>
    </div>
  );

  const doneBanner = finished && (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 bg-success-soft px-5 py-4 text-success">
        <span className="grid size-9 place-items-center rounded-full bg-success text-white">
          <Icon name="check" className="size-5" strokeWidth={3} />
        </span>
        <div>
          <p className="font-bold">{s.done}</p>
          {finished.total ? (
            <p className="text-sm tabular-nums">
              {t.runner.correct}: {finished.correct} / {finished.total} · {Math.round(((finished.correct ?? 0) / finished.total) * 100)}%
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        {next && (
          <ButtonLink href={href(routes.session(next.id))}>
            {s.nextSession}: {next.title} <Icon name="arrowRight" className="size-4" />
          </ButtonLink>
        )}
        <ButtonLink href={href(routes.dashboard)} variant="outline">
          {t.nav.dashboard}
        </ButtonLink>
      </div>
    </Card>
  );

  // ---- To'liq test: ilovadagi adaptiv simulyator
  if (session.kind === "diagnostic" || session.kind === "practice-test") {
    return (
      <div className="space-y-4">
        {header}
        {doneBanner}
        {!finished && (
          <Card className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted">{s.bluebookAlt}</p>
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => finish()}>
              <Icon name="check" className="size-4" /> {s.didInBluebook}
            </Button>
          </Card>
        )}
        <Simulator onFinish={(r) => finish(r)} />
      </div>
    );
  }

  // ---- Modul testi: bo'lim bo'yicha vaqtli test
  if (session.kind === "module-test" && session.section !== "full") {
    const pool = MODULE_TESTS[session.section];
    const test = getPracticeTest(pool[hash(session.id) % pool.length])!;
    return (
      <div className="space-y-4">
        {header}
        {doneBanner}
        <TestRunner test={test} onFinish={(r) => finish(r)} />
      </div>
    );
  }

  // ---- Imtihon oldi
  if (session.kind === "test-prep") {
    return (
      <div className="space-y-4">
        {header}
        {doneBanner ?? <PrepFlow onFinish={() => finish()} />}
      </div>
    );
  }

  // ---- Dars / takrorlash
  return (
    <div className="space-y-4">
      {header}
      {doneBanner ?? <LessonFlow session={session} onFinish={finish} />}
    </div>
  );
}

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Qadamlar chizig'i */
function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex gap-1.5" aria-label="steps">
      {steps.map((label, i) => (
        <li key={label} className="min-w-0 flex-1" aria-current={i === current ? "step" : undefined}>
          <span className={cn("block h-1.5 rounded-full", i < current ? "bg-success" : i === current ? "bg-accent" : "bg-surface-2")} />
          <span className={cn("mt-1.5 block truncate text-[11px] font-semibold", i === current ? "text-fg" : "text-muted")}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

/** Savolga javob: XP (server tekshiradi) va xatolar daftari */
function track(q: Question, correct: boolean, answer: Parameters<typeof gameRepository.track>[1] extends infer B ? B : never) {
  return gameRepository.track(answer.type === "review" ? { type: "review", correct, mastered: answer.mastered } : { type: "practice", correct }, answer);
}

function LessonFlow({ session, onFinish }: { session: PlanSession; onFinish: (r: { correct: number; total: number }) => void }) {
  const { t, locale } = useI18n();
  const s = t.session;
  const today = useToday();
  const mistakes = useMistakes();
  const skill = getSessionSkill(session, locale);
  const [step, setStep] = useState(0);
  const [answered, setAnswered] = useState<Answered[]>([]);

  // Savollar mashg'ulot boshida bir marta tanlanadi (qayta chizilganda o'zgarmaydi)
  const [practice] = useState(() =>
    pickQuestions({
      domainId: session.domainId,
      section: session.section === "full" ? null : session.section,
      difficulty: session.difficulty,
      count: Math.min(session.questions, 10),
      seed: session.id,
    }),
  );
  const warmup = useMemo(() => {
    if (!mistakes || !today) return null;
    const due = dueMistakes(mistakes, today)
      .map((m) => getQuestion(m.questionId))
      .filter((q): q is Question => !!q && !practice.some((p) => p.id === q.id));
    const easy = pickQuestions({ domainId: null, section: session.section === "full" ? null : session.section, difficulty: "easy", count: 3, seed: `${session.id}-w` })
      .filter((q) => !practice.some((p) => p.id === q.id));
    return [...due, ...easy].slice(0, 3);
  }, [mistakes, today, practice, session.section, session.id]);

  const steps = [s.steps.warmup, s.steps.theory, s.steps.practice, s.steps.review];
  const wrong = answered.filter((a) => !a.correct);
  const total = answered.length;
  const correct = answered.filter((a) => a.correct).length;

  const answer = (q: Question, ok: boolean, value: Parameters<Parameters<typeof QuestionDrill>[0]["onAnswer"]>[2]) => {
    const inNotebook = !!mistakesRepository.get()[q.id];
    let mastered = false;
    if (inNotebook) mastered = mistakesRepository.review(q.id, ok).mastered;
    else if (!ok) mistakesRepository.addWrong([q.id]);
    const game = track(q, ok, inNotebook ? { type: "review", questionId: q.id, answer: value, mastered } : { type: "practice", questionId: q.id, answer: value });
    setAnswered((prev) => [...prev, { question: q, correct: ok }]);
    return <span className="font-semibold text-gold">+{game.gained} XP</span>;
  };

  let body: ReactNode = null;
  if (step === 0) {
    body = !warmup ? null : warmup.length ? (
      <QuestionDrill key="warmup" questions={warmup} onAnswer={answer} onExit={() => setStep(1)} exitLabel={s.continue} />
    ) : (
      <Skip text={s.noWarmup} onNext={() => setStep(1)} />
    );
  } else if (step === 1) {
    body = (
      <Card className="space-y-5 p-5 sm:p-7">
        {skill ? (
          <>
            <div>
              <Badge tone="accent">{skill.displayName}</Badge>
              <p className="mt-3 leading-relaxed">{skill.summary}</p>
            </div>
            <section className="rounded-2xl bg-accent-soft p-4">
              <h3 className="text-sm font-semibold text-accent">{t.dashboard.strategies}</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {skill.strategies.map((x) => (
                  <li key={x} className="flex gap-2"><span className="text-accent">→</span><span>{x}</span></li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl bg-warning-soft p-4">
              <h3 className="text-sm font-semibold text-warning">{t.guide.traps}</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {skill.traps.map((x) => (
                  <li key={x} className="flex gap-2"><span className="text-warning">!</span><span>{x}</span></li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <p className="text-muted">{session.subtitle}</p>
        )}
        <Button className="w-full sm:w-auto" onClick={() => setStep(2)}>
          {s.understood} <Icon name="arrowRight" className="size-4" />
        </Button>
      </Card>
    );
  } else if (step === 2) {
    body = practice.length ? (
      <QuestionDrill key="practice" questions={practice} onAnswer={answer} onExit={() => setStep(3)} exitLabel={s.continue} />
    ) : (
      <Skip text={s.noQuestions} onNext={() => setStep(3)} />
    );
  } else {
    body = (
      <div className="space-y-3">
        <Card className="p-4 text-sm">
          {wrong.length ? s.reviewIntro(wrong.length) : s.noMistakes}
        </Card>
        {wrong.map((a) => (
          <QuestionCard key={a.question.id} question={a.question} selected={null} reveal />
        ))}
        <Button size="lg" className="w-full" onClick={() => onFinish({ correct, total })}>
          <Icon name="check" className="size-4" /> {s.finish}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Stepper steps={steps} current={step} />
      {body}
    </div>
  );
}

function Skip({ text, onNext }: { text: string; onNext: () => void }) {
  const { t } = useI18n();
  return (
    <Card className="flex flex-col items-start gap-3 p-5">
      <p className="text-sm text-muted">{text}</p>
      <Button onClick={onNext}>{t.session.continue} <Icon name="arrowRight" className="size-4" /></Button>
    </Card>
  );
}

function PrepFlow({ onFinish }: { onFinish: () => void }) {
  const { t, locale } = useI18n();
  const s = t.session;
  const today = useToday();
  const mistakes = useMistakes();
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const checklist = getSatFacts(locale).checklist;
  const due = useMemo(
    () => (mistakes && today ? dueMistakes(mistakes, today).map((m) => getQuestion(m.questionId)).filter((q): q is Question => !!q).slice(0, 10) : null),
    [mistakes, today],
  );

  const steps = [s.steps.notebook, s.steps.checklist, s.steps.rest];
  let body: ReactNode = null;
  if (step === 0) {
    body = !due ? null : due.length ? (
      <QuestionDrill
        key="prep"
        questions={due}
        exitLabel={s.continue}
        onExit={() => setStep(1)}
        onAnswer={(q, ok, value) => {
          const { mastered } = mistakesRepository.review(q.id, ok);
          const game = gameRepository.track({ type: "review", correct: ok, mastered }, { type: "review", questionId: q.id, answer: value, mastered });
          return <span className="font-semibold text-gold">+{game.gained} XP</span>;
        }}
      />
    ) : (
      <Skip text={s.noMistakes} onNext={() => setStep(1)} />
    );
  } else if (step === 1) {
    body = (
      <Card className="p-5">
        <ul className="space-y-2">
          {checklist.map((item, i) => (
            <li key={item}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl p-2 hover:bg-surface-2/60">
                <input
                  type="checkbox"
                  className="mt-0.5 size-5 accent-[var(--accent)]"
                  checked={checked.has(i)}
                  onChange={() => setChecked((prev) => {
                    const nextSet = new Set(prev);
                    if (nextSet.has(i)) nextSet.delete(i);
                    else nextSet.add(i);
                    return nextSet;
                  })}
                />
                <span className={cn("text-sm", checked.has(i) && "text-muted line-through")}>{item}</span>
              </label>
            </li>
          ))}
        </ul>
        <Button className="mt-4 w-full sm:w-auto" disabled={checked.size < checklist.length} onClick={() => setStep(2)}>
          {checked.size < checklist.length ? `${checked.size} / ${checklist.length}` : s.continue} <Icon name="arrowRight" className="size-4" />
        </Button>
      </Card>
    );
  } else {
    body = (
      <Card className="space-y-4 p-5">
        <p className="leading-relaxed">{s.restText}</p>
        <Button size="lg" className="w-full" onClick={onFinish}>
          <Icon name="check" className="size-4" /> {s.finish}
        </Button>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <Stepper steps={steps} current={step} />
      {body}
    </div>
  );
}
