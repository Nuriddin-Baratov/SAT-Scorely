"use client";

import { useEffect, useState } from "react";

import { gameRepository } from "@/entities/gamification";
import { mistakesRepository } from "@/entities/mistake";
import {
  SIMULATION_ID,
  attemptsRepository,
  buildSimulationSection,
  getPracticeTest,
  simulationPath,
  summarizeAttempt,
  type AdaptivePath,
  type AnswerValue,
  type Question,
  type SimulationSection,
  type TestAttempt,
} from "@/entities/practice-test";
import type { SectionId } from "@/entities/sat";
import { useI18n } from "@/shared/i18n";
import { cn, formatDuration } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { launchConfetti } from "@/shared/ui/confetti";
import { Icon } from "@/shared/ui/icon";
import { Card } from "@/shared/ui/primitives";

import { ModuleRunner, type ModuleResult } from "./module-runner";
import { TestReview, type TestReward } from "./test-review";

const BREAK_SECONDS = 10 * 60;
const ORDER: SectionId[] = ["rw", "math"];

type Stage =
  | { kind: "intro" }
  | { kind: "module"; section: SectionId; module: 1 | 2 }
  | { kind: "between"; section: SectionId; path: AdaptivePath }
  | { kind: "break" }
  | { kind: "done"; attempt: TestAttempt; reward: TestReward };

interface Collected {
  questions: Question[];
  answers: AnswerValue[];
  times: number[];
}

export function Simulator({ onFinish }: { onFinish?: (result: { correct: number; total: number }) => void } = {}) {
  const [run, setRun] = useState(0);
  return <SimulatorRun key={run} onRetry={() => setRun((n) => n + 1)} onFinish={onFinish} />;
}

function SimulatorRun({ onRetry, onFinish }: { onRetry: () => void; onFinish?: (result: { correct: number; total: number }) => void }) {
  const { t } = useI18n();
  const s = t.simulator;
  const [stage, setStage] = useState<Stage>({ kind: "intro" });
  const [sections, setSections] = useState<Record<SectionId, SimulationSection> | null>(null);
  const [paths, setPaths] = useState<Partial<Record<SectionId, AdaptivePath>>>({});
  const [collected, setCollected] = useState<Collected>({ questions: [], answers: [], times: [] });
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const test = getPracticeTest(SIMULATION_ID)!;

  function start() {
    setSections({ rw: buildSimulationSection("rw"), math: buildSimulationSection("math") });
    setStartedAt(Date.now());
    setStage({ kind: "module", section: "rw", module: 1 });
    window.scrollTo({ top: 0 });
  }

  function append(questions: Question[], result: ModuleResult): Collected {
    const next = {
      questions: [...collected.questions, ...questions],
      answers: [...collected.answers, ...result.answers],
      times: [...collected.times, ...result.times],
    };
    setCollected(next);
    return next;
  }

  function finishAll(all: Collected, finalPaths: Partial<Record<SectionId, AdaptivePath>>) {
    const attempt = attemptsRepository.add({
      testId: SIMULATION_ID,
      finishedAt: new Date().toISOString(),
      durationSec: startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0,
      answers: all.answers,
      questionIds: all.questions.map((q) => q.id),
      times: all.times,
      paths: finalPaths,
    });
    const summary = summarizeAttempt(test, attempt);
    mistakesRepository.addWrong(summary.wrongIds);
    const game = gameRepository.track(
      { type: "test", correct: summary.correct, total: summary.total, hardModule: Object.values(finalPaths).includes("hard") },
      { type: "test", id: attempt.id, testId: SIMULATION_ID, questionIds: all.questions.map((q) => q.id), answers: all.answers },
    );
    if (summary.accuracy >= 0.8) launchConfetti();
    onFinish?.({ correct: summary.correct, total: summary.total });
    setStage({ kind: "done", attempt, reward: { xp: game.gained, levelUp: game.levelUp, newMistakes: summary.wrongIds.length } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onModuleFinish(section: SectionId, module: 1 | 2, questions: Question[], result: ModuleResult) {
    const all = append(questions, result);
    window.scrollTo({ top: 0 });
    if (module === 1 && sections) {
      const path = simulationPath(sections[section], result.answers);
      setPaths((p) => ({ ...p, [section]: path }));
      setStage({ kind: "between", section, path });
      return;
    }
    const nextSection = ORDER[ORDER.indexOf(section) + 1];
    if (nextSection) setStage({ kind: "break" });
    else finishAll(all, paths);
  }

  // ---------------- Bosqichlar ----------------

  if (stage.kind === "intro") {
    return <Intro onStart={start} />;
  }

  if (stage.kind === "done") {
    return <TestReview test={test} attempt={stage.attempt} timedOut={false} reward={stage.reward} onRetry={onRetry} />;
  }

  if (stage.kind === "break") {
    return <BreakScreen onContinue={() => setStage({ kind: "module", section: "math", module: 1 })} />;
  }

  if (stage.kind === "between") {
    const hard = stage.path === "hard";
    return (
      <Card className="mx-auto max-w-xl p-8 text-center sm:p-10">
        <span className={cn("mx-auto grid size-16 place-items-center rounded-2xl", hard ? "bg-gold-soft text-gold" : "bg-accent-soft text-accent")}>
          <Icon name={hard ? "bolt" : "layers"} className="size-7" />
        </span>
        <p className="mt-6 text-sm font-semibold text-muted">
          {t.sections[stage.section]} · {t.adaptive.moduleDone}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{hard ? t.adaptive.hardTitle : t.adaptive.easyTitle}</h1>
        <p className="mt-3 leading-relaxed text-muted">{hard ? t.adaptive.hardText : t.adaptive.easyText}</p>
        <Button size="lg" className="mt-8" onClick={() => setStage({ kind: "module", section: stage.section, module: 2 })}>
          {t.adaptive.startModule2} <Icon name="arrowRight" className="size-4" />
        </Button>
      </Card>
    );
  }

  // module
  if (!sections) return null;
  const sec = sections[stage.section];
  const path = paths[stage.section] ?? "easy";
  const questions = stage.module === 1 ? sec.moduleOne : sec[path];
  const step = ORDER.indexOf(stage.section) * 2 + stage.module;

  return (
    <ModuleRunner
      key={`${stage.section}-${stage.module}`}
      title={`${t.sections[stage.section]} · ${stage.module === 1 ? t.adaptive.module1 : t.adaptive.module2}`}
      subtitle={s.step(step, 4)}
      questions={questions}
      minutes={stage.module === 1 ? sec.minutes.moduleOne : sec.minutes.moduleTwo}
      finishLabel={s.finishModule}
      confirmText={s.confirmModule}
      onFinish={(result) => onModuleFinish(stage.section, stage.module, questions, result)}
    />
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  const { t } = useI18n();
  const s = t.simulator;
  return (
    <div className="space-y-6">
      <div className="noise relative overflow-hidden rounded-[2rem] bg-ink p-8 text-white sm:p-12">
        <div className="aurora opacity-80" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#bfdbfe] uppercase">{s.eyebrow}</p>
          <h1 className="mt-4 text-4xl leading-tight font-bold sm:text-5xl">{s.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-white/65">{s.text}</p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8 bg-white text-ink hover:opacity-100 hover:brightness-95"
            onClick={onStart}
          >
            <Icon name="play" className="size-4" /> {s.start}
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {s.timeline.map((item, i) => (
          <Card key={item.title} className={cn("p-5", i === 2 && "bg-surface-2/60")}>
            <p className="text-xs font-semibold text-muted">0{i + 1}</p>
            <p className="mt-2 font-semibold">{item.title}</p>
            <p className="mt-1 text-sm text-muted">{item.text}</p>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <p className="text-sm font-semibold">{s.rulesTitle}</p>
        <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
          {s.rules.map((rule) => (
            <li key={rule} className="flex gap-2">
              <Icon name="check" className="mt-0.5 size-4 shrink-0 text-success" /> {rule}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function BreakScreen({ onContinue }: { onContinue: () => void }) {
  const { t } = useI18n();
  const s = t.simulator;
  const [left, setLeft] = useState(BREAK_SECONDS);

  useEffect(() => {
    const id = window.setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Card className="mx-auto max-w-xl p-8 text-center sm:p-10">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success-soft text-success">
        <Icon name="clock" className="size-7" />
      </span>
      <h1 className="mt-6 text-3xl font-bold">{s.breakTitle}</h1>
      <p className="mt-3 text-muted">{s.breakText}</p>
      <p className="mt-6 font-mono text-5xl font-bold tabular-nums" role="timer">
        {formatDuration(left)}
      </p>
      <Button size="lg" className="mt-8" onClick={onContinue}>
        {left > 0 ? s.skipBreak : s.continue} <Icon name="arrowRight" className="size-4" />
      </Button>
    </Card>
  );
}
