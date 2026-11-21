"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "@/shared/i18n";
import { Icon } from "@/shared/ui/icon";

import { questions, type Answers } from "../model/quiz";
import { answersStore, flowRoutes } from "../model/store";
import { journeyTexts } from "../model/texts";

/** Bosqichma-bosqich so'rovnoma: har savol alohida ekranda, javob tanlanishi bilan keyingisiga o'tadi. */
export function LevelQuiz({ modal }: { modal?: boolean }) {
  const { locale, href } = useI18n();
  const q = journeyTexts[locale].quiz;
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Saqlangan javoblar (qayta topshirishda belgilangan bo'lib turadi) + shu safar tanlanganlari
  const saved = answersStore.useValue();
  const [picked, setAnswers] = useState<Partial<Answers>>({});
  const answers: Partial<Answers> = { ...saved, ...picked };
  const { key, options } = questions[step];

  const label = (value: string | number) => {
    if (key === "current") return value === "none" ? q.none : String(value);
    if (key === "target") return value === 1500 ? "1500+" : String(value);
    if (key === "months") return q.month(value as number);
    if (key === "minutes") return q.minute(value as number);
    return value === "math" ? "Math" : value === "rw" ? "Reading & Writing" : q.both;
  };

  function choose(value: string | number) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 180);
      return;
    }
    answersStore.set(next as Answers);
    // Modalda bosqich o'zi almashadi; sahifada (qayta topshirish) — reja sahifasiga.
    if (!modal) router.replace(href(flowRoutes.plan));
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex items-center justify-between text-sm text-white/55">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 transition hover:text-white disabled:invisible"
        >
          <Icon name="arrowLeft" className="size-4" /> {q.back}
        </button>
        <span className="font-semibold tabular-nums">{q.step(step + 1, questions.length)}</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#93c5fd] to-[#60a5fa] transition-[width] duration-500"
          style={{ width: `${((step + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div key={step} className="pro-in mt-10">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#93c5fd] uppercase">{q.eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{q.q[key]}</h1>
        <div className="mt-8 grid gap-3">
          {options.map((value) => {
            const active = answers[key] === value;
            return (
              <button key={value} type="button" aria-pressed={active} onClick={() => choose(value)} className="pro-option">
                {label(value)}
                <span className={active ? "text-[#93c5fd]" : "text-white/25"}>
                  <Icon name={active ? "check" : "arrowRight"} className="size-4" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
