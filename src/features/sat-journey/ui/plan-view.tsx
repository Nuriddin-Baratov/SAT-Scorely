"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { studentRepository, useStudentProfile } from "@/entities/student";
import { progressRepository } from "@/entities/study-plan";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { cn, daysBetween, parseISODate } from "@/shared/lib";
import { useToday } from "@/shared/lib/react";
import { Icon } from "@/shared/ui/icon";
import { Particles } from "@/shared/ui/premium";

import { buildPlan, toProfile, type Answers, type PersonalPlan, type WeekPlan } from "../model/quiz";
import { accountStore, activePlanStore, answersStore, flowRoutes, sameAnswers } from "../model/store";
import { journeyTexts } from "../model/texts";

function useTexts() {
  const { locale } = useI18n();
  return journeyTexts[locale].plan;
}

function Summary({ plan }: { plan: PersonalPlan }) {
  const p = useTexts();
  const items = [
    [p.level, p.levels[plan.level]],
    [p.current, `~${plan.current}`],
    [p.target, String(plan.target)],
    [p.gap, `+${plan.gap}`],
    [p.weeks, String(plan.weeks.length)],
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
      {items.map(([label, value], i) => (
        <div key={label} className={cn("pro-card p-2.5 sm:p-4", i === 0 && "col-span-3 sm:col-span-1")}>
          <p className="truncate text-[11px] text-white/60 sm:text-xs">{label}</p>
          <p className={cn("mt-0.5 font-display text-base font-bold sm:mt-1 sm:text-xl", i === 0 || i === 3 ? "pro-gradient-text" : "text-white")}>{value}</p>
        </div>
      ))}
    </div>
  );
}

function Daily({ plan }: { plan: PersonalPlan }) {
  const p = useTexts();
  const d = plan.daily;
  const tasks = [p.tasks.math(d.math), p.tasks.rw(d.rw), p.tasks.review(d.review), p.tasks.questions(d.questions), p.tasks.words(d.words)];
  return (
    <div className="pro-card p-5">
      <p className="font-semibold">{p.daily}</p>
      <ul className="mt-3 grid gap-2 text-sm text-white/75 sm:grid-cols-2">
        {tasks.map((task) => (
          <li key={task} className="flex items-start gap-2">
            <Icon name="check" className="mt-0.5 size-4 shrink-0 text-[#93c5fd]" /> {task}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-white/45">{p.perWeek(plan.perWeek)}</p>
    </div>
  );
}

function WeekCard({ week, current }: { week: WeekPlan; current?: boolean }) {
  const p = useTexts();
  return (
    <div className={cn("pro-card pro-in p-5", current && "ring-1 ring-[#93c5fd]/60")} style={{ animationDelay: `${Math.min(week.index, 8) * 40}ms` }}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-display font-bold">{p.week(week.index)}</p>
        {week.test && (
          <span className="rounded-full bg-[#93c5fd]/15 px-2.5 py-1 text-[11px] font-semibold text-[#93c5fd]">{p.test}</span>
        )}
      </div>
      {week.final ? (
        <p className="mt-3 text-sm text-white/70">{p.final}</p>
      ) : (
        <div className="mt-3 space-y-2 text-sm">
          {(["math", "rw"] as const).map((s) => (
            <div key={s}>
              <p className={cn("text-[11px] font-semibold tracking-wider uppercase", s === "math" ? "text-[#93c5fd]" : "text-[#93c5fd]")}>
                {s === "math" ? "Math" : "Reading & Writing"}
              </p>
              <p className="text-white/75">{week[s].join(" · ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Rejani ko'rsatish sahifasi: kartochkalar + "Boshlash". */
export function PlanView({ modal }: { modal?: boolean }) {
  const { locale, href } = useI18n();
  const p = journeyTexts[locale].plan;
  const router = useRouter();
  const answers = answersStore.useValue();
  const plan = useMemo(() => (answers ? buildPlan(answers) : null), [answers]);
  if (!answers || !plan) return null;

  function start(a: Answers) {
    const prev = studentRepository.get();
    // Reja o'zgarmagan bo'lsa — profil va bajarilgan darslar progressi saqlanib qoladi.
    if (!prev || !sameAnswers(activePlanStore.get(), a)) {
      const account = accountStore.get() ?? { name: prev?.fullName ?? "", email: prev?.email ?? "" };
      studentRepository.save(toProfile(a, account, prev));
      progressRepository.reset();
      activePlanStore.set(a);
    }
    router.replace(href(routes.dashboard));
  }

  return (
    <div className="pro-in space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-[#93c5fd] uppercase">{p.eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{p.title}</h1>
      </div>
      <Summary plan={plan} />
      <Daily plan={plan} />
      <div className="grid gap-3 sm:grid-cols-2">
        {plan.weeks.map((w) => (
          <WeekCard key={w.index} week={w} />
        ))}
      </div>
      <div className="sticky bottom-0 -mx-1 flex rounded-2xl bg-ink/85 p-1 py-3 backdrop-blur flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
        {modal ? (
          // Modalda: javoblar o'chadi → bosqich yana so'rovnomaga qaytadi
          <button type="button" onClick={() => answersStore.clear()} className="text-sm text-white/55 hover:text-white">
            {p.retake}
          </button>
        ) : (
          <Link prefetch href={href(flowRoutes.quiz)} className="text-sm text-white/55 hover:text-white">
            {p.retake}
          </Link>
        )}
        <button type="button" onClick={() => start(answers)} className="pro-btn w-full sm:w-auto">
          {p.start} <Icon name="arrowRight" className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Dashboard ustidagi reja paneli: joriy hafta, kunlik vazifalar, kerak bo'lsa barcha haftalar. */
export function PlanPanel() {
  const { locale, href } = useI18n();
  const p = journeyTexts[locale].plan;
  // Faqat "Boshlash" bosilgan reja — qayta topshirish yarim qolsa ham dashboard bir-biriga zid bo'lmaydi.
  const active = activePlanStore.useValue();
  const profile = useStudentProfile();
  const [open, setOpen] = useState(false);
  const plan = useMemo(() => (active ? buildPlan(active) : null), [active]);
  const started = profile?.planStartDate;
  const today = useToday();
  if (!plan) return null;

  const elapsed = started && today ? Math.floor(daysBetween(parseISODate(started), parseISODate(today)) / 7) : 0;
  const current = Math.min(plan.weeks.length - 1, Math.max(0, elapsed));

  return (
    <section className="relative mb-3 overflow-hidden rounded-2xl bg-ink p-4 text-white sm:mb-6 sm:rounded-[2rem] sm:p-8">
      <Particles />
      <div className="relative space-y-3 sm:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold sm:text-2xl">
            <span className="pro-gradient-text">{p.yourPlan}</span>
          </h2>
          <Link prefetch href={href(flowRoutes.plan)} className="text-sm text-white/55 hover:text-white">
            {p.edit} →
          </Link>
        </div>
        <Summary plan={plan} />
        {/* Mobilda tafsilotlar "ko'proq" bosilganda ochiladi — birinchi ekran qisqa bo'lsin */}
        <div className={cn("gap-3 lg:grid lg:grid-cols-[1fr_1.2fr]", open ? "grid" : "hidden")}>
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase">{p.thisWeek}</p>
            <WeekCard week={plan.weeks[current]} current />
          </div>
          <Daily plan={plan} />
        </div>
        {open && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plan.weeks.map((w) => (
              <WeekCard key={w.index} week={w} current={w.index === current + 1} />
            ))}
          </div>
        )}
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-sm font-semibold text-white/85 hover:underline">
          {open ? p.showLess : p.showAll}
        </button>
      </div>
    </section>
  );
}
