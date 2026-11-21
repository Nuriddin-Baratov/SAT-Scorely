"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { isAnswered, isCorrect, QuestionCard, questions, type AnswerValue, type ChoiceQuestion } from "@/entities/practice-test";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { launchConfetti } from "@/shared/ui/confetti";
import { Icon } from "@/shared/ui/icon";

/** Sahifa tepasida ingichka o'qish progressi chizig'i (mobil uchun ham). */
export function ReadingBar() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      ref.current?.style.setProperty("transform", `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <span className="pointer-events-none fixed inset-x-0 top-0 z-[45] h-[3px]" aria-hidden>
      <span ref={ref} className="block h-full origin-left scale-x-0 bg-gradient-to-r from-[#5b8cff] via-accent to-[#f5c76b] shadow-[0_0_10px_var(--accent)]" />
    </span>
  );
}

/** `.spot` kartochkalarda kursor ortidan yuruvchi yumshoq yorug'lik (CSS o'zgaruvchilari orqali). */
export function Spotlight() {
  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        document.querySelectorAll<HTMLElement>(".spot").forEach((el) => {
          const r = el.getBoundingClientRect();
          el.style.setProperty("--mx", `${e.clientX - r.left}px`);
          el.style.setProperty("--my", `${e.clientY - r.top}px`);
        });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);
  return null;
}

/** Haqiqiy SAT uslubidagi savol: tanlash → tekshirish → tushuntirish, to'g'ri bo'lsa konfetti. */
export function SampleQuestion() {
  const { t } = useI18n();
  const s = t.guide.sample;
  const [section, setSection] = useState<"rw" | "math">("rw");
  const [seed, setSeed] = useState(0);
  const [choice, setChoice] = useState<AnswerValue>(null);
  const [checked, setChecked] = useState(false);
  const [streak, setStreak] = useState(0);
  const pool = useMemo(
    () => questions.filter((q): q is ChoiceQuestion => q.format !== "spr" && q.sectionId === section),
    [section],
  );
  const question = pool[seed % pool.length];
  const correct = checked && isCorrect(question, choice);

  function next(sec = section) {
    setSection(sec);
    // Bankdagi keyingi savol — hammasi aylanib chiqmaguncha takrorlanmaydi
    setSeed((n) => n + 1);
    setChoice(null);
    setChecked(false);
  }

  function check() {
    if (!isAnswered(choice)) return;
    setChecked(true);
    if (isCorrect(question, choice)) {
      setStreak((n) => n + 1);
      launchConfetti({ particles: 90, duration: 2000 });
    } else setStreak(0);
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[#0b0f1a] p-4 text-white sm:p-8">
      <div className="pointer-events-none absolute -top-32 left-1/3 size-96 rounded-full bg-accent/25 blur-3xl" aria-hidden />
      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-4 px-2 sm:px-0">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#f5c76b] uppercase">{s.eyebrow}</p>
            <h3 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{s.title}</h3>
            <p className="mt-1 max-w-lg text-sm text-white/60">{s.text}</p>
          </div>
          <div className="flex rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10" role="tablist">
            {(["rw", "math"] as const).map((sec) => (
              <button
                key={sec}
                type="button"
                role="tab"
                aria-selected={section === sec}
                onClick={() => next(sec)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                  section === sec ? "bg-white text-[#0b0f1a]" : "text-white/60 hover:text-white",
                )}
              >
                {sec === "rw" ? "Reading & Writing" : "Math"}
              </button>
            ))}
          </div>
        </div>

        <div key={question.id} className="mt-6 animate-fade-up text-fg">
          <QuestionCard question={question} selected={choice} onSelect={checked ? undefined : setChoice} reveal={checked} />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-2 sm:px-0">
          <p className={cn("min-h-6 text-sm font-semibold", checked ? (correct ? "text-emerald-300" : "text-rose-300") : "text-white/50")}>
            {checked ? (correct ? t.practice.correct : t.practice.incorrect) : ""}
            {streak > 1 && <span className="ml-3 rounded-full bg-[#f5c76b]/15 px-2.5 py-1 text-[#f5c76b]">{s.streak(streak)}</span>}
          </p>
          {checked ? (
            <button type="button" onClick={() => next()} className="pro-btn">
              {s.another} <Icon name="refresh" className="size-4" />
            </button>
          ) : (
            <button type="button" onClick={check} disabled={!isAnswered(choice)} className="pro-btn">
              {t.daily.check} <Icon name="check" className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Mundarija: ekrandagi bo'lim ajralib turadi, yuqorida o'qish progressi. */
export function TocSpy({ items, label, progressLabel }: { items: { id: string; label: string }[]; label: string; progressLabel: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [items]);

  return (
    <nav aria-label={label} className="sticky top-6 rounded-3xl border border-border bg-surface/70 p-4 backdrop-blur">
      <div className="flex items-center justify-between px-2 text-xs font-semibold text-muted">
        <span className="tracking-wider uppercase">{label}</span>
        <span className="tabular-nums">
          {progressLabel} {Math.round(progress * 100)}%
        </span>
      </div>
      <div className="mx-2 mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-gradient-to-r from-accent to-gold transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
      </div>
      <ul className="mt-3 space-y-0.5 text-sm">
        {items.map((item, i) => {
          const on = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={on ? "location" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-2 py-1.5 transition",
                  on ? "bg-accent-soft font-semibold text-accent" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold tabular-nums transition",
                    on ? "bg-accent text-accent-fg shadow-[0_0_0_4px_var(--accent-soft)]" : "bg-surface-2",
                  )}
                >
                  {i + 1}
                </span>
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface Band {
  range: string;
  percentile: string;
  label: string;
  note: string;
}
const bandColors = ["#f5c76b", "#8b7dff", "#5b8cff", "#34d399", "#94a3b8"];

/** Interaktiv ball shkalasi: slayder qiymati qaysi darajaga tushishini ko'rsatadi. */
export function ScoreExplorer({ bands, title, hint, percentileLabel }: { bands: readonly Band[]; title: string; hint: string; percentileLabel: string }) {
  const [score, setScore] = useState(1250);
  const parsed = bands.map((b, i) => {
    const [min, max] = b.range.split("–").map((n) => Number(n.replace(/\D/g, "")));
    return { ...b, min, max, color: bandColors[i % bandColors.length] };
  });
  const band = parsed.find((b) => score >= b.min && score <= b.max) ?? parsed[parsed.length - 1];
  const pos = (v: number) => ((v - 400) / 1200) * 100;

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[#0b0f1a] p-6 text-white sm:p-8">
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl transition-colors duration-500" style={{ background: `${band.color}33` }} aria-hidden />
      <div className="relative">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#f5c76b] uppercase">{title}</p>
        <p className="mt-1 text-sm text-white/55">{hint}</p>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <p className="font-display text-7xl leading-none font-extrabold tabular-nums">
            <span className="pro-gradient-text">{score}</span>
          </p>
          <div className="text-right">
            <span className="inline-block rounded-full px-3 py-1 text-sm font-bold text-[#0b0f1a] transition-colors" style={{ background: band.color }}>
              {band.label}
            </span>
            <p className="mt-1.5 text-sm text-white/60">
              {band.percentile} {percentileLabel}
            </p>
          </div>
        </div>

        {/* Shkala */}
        <div className="relative mt-8">
          <div className="flex h-3 overflow-hidden rounded-full">
            {[...parsed].reverse().map((b) => (
              <div
                key={b.range}
                className="h-full transition-opacity"
                style={{ width: `${pos(Math.min(b.max + 10, 1600)) - pos(b.min)}%`, background: b.color, opacity: b === band ? 1 : 0.3 }}
              />
            ))}
          </div>
          <span
            className="pointer-events-none absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#0b0f1a] shadow-[0_0_0_2px_white,0_0_18px_white]"
            style={{ left: `${pos(score)}%`, background: band.color }}
            aria-hidden
          />
          <input
            type="range"
            min={400}
            max={1600}
            step={10}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            aria-label={title}
            className="absolute inset-x-0 -top-3 h-9 w-full cursor-pointer opacity-0"
          />
          <div className="mt-2 flex justify-between text-[11px] text-white/40 tabular-nums">
            <span>400</span>
            <span>1000</span>
            <span>1600</span>
          </div>
        </div>

        <p key={band.range} className="mt-6 animate-fade-up rounded-2xl bg-white/[0.05] p-4 text-sm leading-relaxed text-white/75 ring-1 ring-white/10">
          {band.note}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {parsed.map((b) => (
            <button
              key={b.range}
              type="button"
              onClick={() => setScore(Math.round((b.min + Math.min(b.max, 1600)) / 20) * 10)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums ring-1 transition",
                b === band ? "bg-white/10 text-white ring-white/30" : "text-white/50 ring-white/10 hover:text-white",
              )}
            >
              <span className="mr-1.5 inline-block size-2 rounded-full" style={{ background: b.color }} />
              {b.range}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Test kuni ro'yxati: bandlarni belgilash mumkin, progress ko'rinadi. */
export function Checklist({ items }: { items: readonly string[] }) {
  // Funksiya serverdan uzatilmaydi — matn shu yerda lug'atdan olinadi
  const doneLabel = useI18n().t.guide.checklistDone;
  const [done, setDone] = useState<Set<number>>(new Set());
  const toggle = (i: number) => {
    const next = new Set(done);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setDone(next);
    // Hammasi belgilandi — tayyor! 🎉
    if (next.size === items.length && done.size < items.length) launchConfetti();
  };
  const pct = (done.size / items.length) * 100;

  return (
    <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-card sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className={cn("text-sm font-semibold transition", done.size === items.length ? "text-success" : "text-muted")}>
          {doneLabel(done.size, items.length)}
        </p>
        <span className="text-sm font-bold tabular-nums">{Math.round(pct)}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {items.map((item, i) => {
          const on = done.has(i);
          return (
            <li key={item}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(i)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left text-sm transition",
                  on ? "border-success/40 bg-success-soft" : "border-border hover:border-fg/20 hover:bg-surface-2/60",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition",
                    on ? "scale-110 border-success bg-success text-white" : "border-border",
                  )}
                >
                  {on && <Icon name="check" className="size-3.5" strokeWidth={3} />}
                </span>
                <span className={cn("transition", on && "text-muted line-through decoration-success/60")}>{item}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
