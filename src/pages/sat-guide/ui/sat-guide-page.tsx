import type { CSSProperties, ReactNode } from "react";

import { GuideFold } from "./guide-fold";

import {
  domainDescription,
  getDomainsBySection,
  getSatFacts,
  localizeSection,
  localizeSkill,
  sections,
} from "@/entities/sat";
import { routes } from "@/shared/config";
import { getDictionary, localizePath, type Locale } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Particles } from "@/shared/ui/premium";

import { Checklist, ReadingBar, SampleQuestion, ScoreExplorer, Spotlight, TocSpy } from "./guide-interactive";

/** Bo'lim sarlavhasi: raqamli belgi + eyebrow + katta sarlavha (scroll bilan paydo bo'ladi). */
function H2({ id, n, eyebrow, children }: { id: string; n: number; eyebrow: string; children: ReactNode }) {
  return (
    <div id={id} className="reveal flex scroll-mt-24 items-start gap-4 lg:scroll-mt-6">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-[#1e40af] font-display text-sm font-bold text-white shadow-[0_10px_30px_-10px_var(--accent)] sm:size-12 sm:rounded-2xl sm:text-lg">
        {String(n).padStart(2, "0")}
      </span>
      <div>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-accent uppercase sm:text-xs">{eyebrow.replace(/^\d+\s*·\s*/, "")}</p>
        <h2 className="mt-0.5 text-lg leading-tight font-bold sm:mt-1.5 sm:text-4xl">{children}</h2>
      </div>
    </div>
  );
}

const overviewIcons: IconName[] = ["clock", "list", "trophy"];
const sectionTheme = {
  rw: { text: "text-accent", soft: "bg-accent-soft", ring: "#60a5fa", from: "from-accent/20", icon: "book" as IconName },
  math: { text: "text-gold", soft: "bg-gold-soft", ring: "#93c5fd", from: "from-gold/20", icon: "calculator" as IconName },
};

/** Domenning imtihondagi ulushi — kichik donut */
function Donut({ value, color }: { value: number; color: string }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-14 shrink-0">
      <svg viewBox="0 0 40 40" className="size-full -rotate-90" aria-hidden>
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="5" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="ring-draw"
          style={{ "--c": c } as CSSProperties}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xs font-bold tabular-nums">{value}%</span>
    </div>
  );
}

export function SatGuidePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const g = t.guide;
  const facts = getSatFacts(locale);
  const flow = t.home.structure.flow;
  const [rw, math] = sections;
  const timeline = [
    { label: `R&W · 1`, min: rw.modules.minutes, cls: "from-[#60a5fa] to-[#2563eb]" },
    { label: `R&W · 2`, min: rw.modules.minutes, cls: "from-[#bfdbfe] to-[#60a5fa]" },
    { label: "☕", min: 10, cls: "from-white/25 to-white/10" },
    { label: `Math · 1`, min: math.modules.minutes, cls: "from-[#dbeafe] to-[#93c5fd]" },
    { label: `Math · 2`, min: math.modules.minutes, cls: "from-[#93c5fd] to-amber-500" },
  ];
  const totalMin = timeline.reduce((s, x) => s + x.min, 0);
  // Yuguruvchi lenta: barcha SAT ko'nikmalari (bo'lim rangi bilan)
  const skills = sections.flatMap((s) =>
    getDomainsBySection(s.id).flatMap((d) => d.skills.map((sk) => ({ name: sk.name, section: s.id }))),
  );

  const toc = [
    { id: "overview", label: g.toc.overview },
    { id: "structure", label: g.toc.structure },
    { id: "adaptive", label: g.toc.adaptive },
    { id: "rw", label: "Reading & Writing" },
    { id: "math", label: "Math" },
    { id: "scoring", label: g.toc.scoring },
    { id: "registration", label: g.toc.registration },
    { id: "test-day", label: g.toc.testDay },
    { id: "strategies", label: g.toc.strategies },
    { id: "faq", label: g.toc.faq },
  ];
  const num = (id: string) => toc.findIndex((x) => x.id === id) + 1;

  return (
    <main className="flex-1">
      <ReadingBar />
      <Spotlight />
      {/* ================= HERO ================= */}
      <section className="px-3 pt-3">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-ink text-white">
          <Particles />
          <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pt-14 pb-16 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-20 lg:pb-20">
            <div className="pro-in">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-white/85 ring-1 ring-white/10">
                <Icon name="book" className="size-3.5 text-[#93c5fd]" /> {g.badge}
              </span>
              <h1 className="mt-6 text-5xl leading-[0.98] font-bold sm:text-6xl lg:text-7xl">
                {g.titleA}{" "}
                <span className="pro-gradient-text font-serif text-[1.1em] font-normal tracking-normal italic">{g.titleAccent}</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-white/65">{g.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={localizePath(locale, routes.onboarding)} className="pro-btn">
                  {t.home.heroCta} <Icon name="arrowRight" className="size-4" />
                </a>
                <a
                  href="#structure"
                  className="inline-flex h-[3.25rem] items-center gap-2 rounded-full px-6 font-semibold text-white/80 ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white"
                >
                  {g.toc.structure} <Icon name="chevronDown" className="size-4" />
                </a>
              </div>
            </div>

            {/* Imtihon vaqt chizig'i (atrofida suzuvchi chiplar) */}
            <div className="relative">
              <span className="animate-float absolute -top-5 -left-4 z-10 hidden rounded-2xl bg-white px-3 py-2 text-xs font-bold text-[#1e3a8a] shadow-lift lg:block">
                🎯 400 – 1600
              </span>
              <span className="animate-float absolute -right-3 -bottom-5 z-10 hidden rounded-2xl bg-gradient-to-r from-[#93c5fd] to-[#dbeafe] px-3 py-2 text-xs font-bold text-[#1e3a8a] shadow-lift [animation-delay:-3s] lg:block">
                ⚡ {t.adaptive.badge} · Bluebook
              </span>
            <div className="pro-card pro-in p-6 [animation-delay:150ms] sm:p-7">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{g.structure.title}</span>
                <span className="font-display font-bold text-[#93c5fd] tabular-nums">{totalMin} {t.common.min}</span>
              </div>
              <div className="meter-run mt-5 flex h-14 gap-1.5">
                {timeline.map((seg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "meter-fill relative grid basis-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-b text-[10px] font-bold text-[#1e3a8a]",
                      seg.cls,
                    )}
                    style={{ flexGrow: seg.min, "--d": `${300 + i * 140}ms` } as CSSProperties}
                    title={`${seg.label} · ${seg.min} ${t.common.min}`}
                  >
                    <span className="hidden truncate px-1 sm:block">{seg.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {g.heroStats.map(([v, l], i) => (
                  <div key={l} className="rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10 pro-in" style={{ animationDelay: `${400 + i * 90}ms` }}>
                    <p className="font-display text-xl font-bold text-[#dbeafe]">{v}</p>
                    <p className="text-xs text-white/50">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>

          {/* Yuguruvchi lenta: barcha ko'nikmalar */}
          <div className="relative overflow-hidden border-t border-white/10 py-4 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
            <div className="animate-marquee flex w-max gap-3 hover:[animation-play-state:paused]">
              {[...skills, ...skills].map((sk, i) => (
                <span
                  key={i}
                  aria-hidden={i >= skills.length}
                  className="flex shrink-0 items-center gap-2 rounded-full bg-white/[0.05] px-4 py-1.5 text-sm text-white/70 ring-1 ring-white/10"
                >
                  <span className={cn("size-1.5 rounded-full", sk.section === "rw" ? "bg-[#bfdbfe]" : "bg-[#93c5fd]")} />
                  {sk.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-4 sm:px-6 lg:grid-cols-[250px_1fr] lg:py-20">
        <aside className="hidden lg:block">
          <TocSpy items={toc} label={g.tocLabel} progressLabel={g.readProgress} />
        </aside>

        <article className="min-w-0 space-y-2.5 lg:space-y-24">
          {/* Mobil mundarija */}
          <nav aria-label={g.tocLabel} className="-mx-4 hidden gap-2 overflow-x-auto px-4 pb-1">
            {toc.map((item, i) => (
              <a key={item.id} href={`#${item.id}`} className="shrink-0 rounded-full bg-surface-2 px-3.5 py-2 text-sm font-medium text-muted hover:text-fg">
                <span className="mr-1.5 text-xs text-accent tabular-nums">{i + 1}</span>
                {item.label}
              </a>
            ))}
          </nav>

          {/* ================= Umumiy ================= */}
          <GuideFold id="overview" heading={<H2 id="overview" n={num("overview")} eyebrow={g.overview.eyebrow}>{g.overview.title}</H2>}>
            <div className="space-y-4 text-lg leading-relaxed text-muted">
              {g.overview.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {g.overview.cards.map(([a, b], i) => (
                <div
                  key={a}
                  className="spot reveal group relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-accent/10 blur-2xl transition group-hover:bg-accent/25" aria-hidden />
                  <span className="relative grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-accent-soft to-gold-soft text-accent">
                    <Icon name={overviewIcons[i] ?? "star"} className="size-5" />
                  </span>
                  <p className="relative mt-5 text-xl font-bold tracking-tight">{a}</p>
                  <p className="relative mt-1 text-sm text-muted">{b}</p>
                </div>
              ))}
            </div>
          </GuideFold>

          {/* ================= Savolni sinab ko'rish ================= */}
          <SampleQuestion />

          {/* ================= Tuzilma ================= */}
          <GuideFold id="structure" heading={<H2 id="structure" n={num("structure")} eyebrow={g.structure.eyebrow}>{g.structure.title}</H2>}>
            <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
              {sections.map((s, idx) => {
                const th = sectionTheme[s.id];
                const card = (
                  <div key={s.id} className={cn("reveal relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br to-surface p-6", th.from)}>
                    <div className="flex items-center gap-3">
                      <span className={cn("grid size-10 place-items-center rounded-xl", th.soft, th.text)}>
                        <Icon name={th.icon} className="size-5" />
                      </span>
                      <p className="text-lg font-bold">{s.name}</p>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      {[1, 2].map((m) => (
                        <div key={m} className="rounded-2xl bg-surface/80 p-3.5 ring-1 ring-border">
                          <p className={cn("text-xs font-bold", th.text)}>{m === 1 ? t.adaptive.module1 : t.adaptive.module2}</p>
                          <p className="mt-1 font-display text-2xl font-bold tabular-nums">{s.modules.questions}</p>
                          <p className="text-xs text-muted">
                            {t.common.questions} · {s.modules.minutes} {t.common.min}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                      <span>
                        <strong className="text-fg tabular-nums">{s.questions}</strong> {t.common.questions}
                      </span>
                      <span>
                        <strong className="text-fg tabular-nums">{s.minutes}</strong> {t.common.min}
                      </span>
                      <span>
                        ≈<strong className="text-fg tabular-nums">{Math.round((s.minutes * 60) / s.questions)}</strong> {g.structure.seconds}
                      </span>
                    </div>
                  </div>
                );
                return idx === 0 ? (
                  [
                    card,
                    <div key="break" className="flex items-center justify-center">
                      <span className="rounded-full border border-dashed border-border bg-surface-2 px-4 py-2 text-xs font-semibold text-muted md:[writing-mode:vertical-rl] md:py-4">
                        ☕ {g.breakLabel}
                      </span>
                    </div>,
                  ]
                ) : (
                  card
                );
              })}
            </div>
            <div className="reveal flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-ink p-5 text-white sm:px-7">
              <p className="font-semibold">{g.structure.total}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/70">
                <span>{g.structure.fourModules}</span>
                <span>
                  <strong className="text-white">98</strong> {t.common.questions}
                </span>
                <span>{g.structure.totalTime}</span>
              </div>
            </div>
            <p className="flex gap-3 rounded-2xl bg-accent-soft/60 p-4 text-sm text-muted">
              <Icon name="sparkles" className="mt-0.5 size-4 shrink-0 text-accent" /> {g.structure.pretest}
            </p>
          </GuideFold>

          {/* ================= Adaptiv ================= */}
          <GuideFold id="adaptive" heading={<H2 id="adaptive" n={num("adaptive")} eyebrow={g.adaptive.eyebrow}>{g.adaptive.title}</H2>}>
            <div className="reveal relative overflow-hidden rounded-[2rem] bg-ink p-6 text-white sm:p-8">
              <Particles />
              <div className="relative grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-2xl bg-white/[0.05] p-5 ring-1 ring-white/10">
                  <p className="text-sm font-bold text-[#bfdbfe]">{flow.m1}</p>
                  <p className="text-xs text-white/50">{flow.m1Sub}</p>
                  <p className="mt-3 text-sm text-white/70">{g.adaptive.m1}</p>
                </div>

                {/* Algoritm tuguni */}
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <span className="relative grid size-16 place-items-center rounded-full bg-gradient-to-br from-[#93c5fd] to-[#60a5fa] text-[#1e3a8a] shadow-[0_0_30px_rgb(245_199_107/0.5)]">
                    <span className="absolute inset-0 animate-ping rounded-full bg-[#93c5fd]/30" aria-hidden />
                    <Icon name="brain" className="relative size-7" />
                  </span>
                  <p className="text-sm font-bold">{flow.algo}</p>
                  <p className="max-w-40 text-xs text-white/50">{g.adaptive.algo}</p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-gradient-to-r from-[#93c5fd]/20 to-transparent p-4 ring-1 ring-[#93c5fd]/40">
                    <p className="flex items-center gap-2 text-sm font-bold text-[#93c5fd]">
                      <Icon name="trending" className="size-4" /> {flow.hard}
                    </p>
                    <p className="text-xs text-white/55">{flow.hardSub}</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
                    <p className="text-sm font-bold text-white/80">{flow.easy}</p>
                    <p className="text-xs text-white/45">{flow.easySub}</p>
                  </div>
                </div>
              </div>
              <p className="relative mt-6 border-t border-white/10 pt-5 text-sm leading-relaxed text-white/65">{g.adaptive.m2}</p>
            </div>
            <p className="flex gap-3 rounded-2xl border-l-4 border-gold bg-gold-soft/60 p-4 leading-relaxed">
              <Icon name="bolt" className="mt-1 size-4 shrink-0 text-gold" /> {g.adaptive.takeaway}
            </p>
          </GuideFold>

          {/* ================= Bo'limlar ================= */}
          {sections.map((raw) => {
            const section = localizeSection(raw, locale);
            const th = sectionTheme[section.id];
            return (
              <GuideFold key={section.id} id={section.id} heading={<H2 id={section.id} n={num(section.id)} eyebrow={g.sectionEyebrow}>
                  {section.name}
                </H2>}>
                <div className={cn("reveal rounded-3xl bg-gradient-to-br to-transparent p-6 sm:p-8", th.from)}>
                  <p className="text-lg leading-relaxed">{section.description}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className="rounded-2xl bg-surface px-4 py-2 text-sm shadow-card">
                      <strong className={cn("font-display text-xl", th.text)}>{raw.questions}</strong> {t.common.questions}
                    </span>
                    <span className="rounded-2xl bg-surface px-4 py-2 text-sm shadow-card">
                      <strong className={cn("font-display text-xl", th.text)}>{raw.minutes}</strong> {t.common.min}
                    </span>
                  </div>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {section.highlights.map((h) => (
                      <li key={h} className={cn("rounded-full px-3 py-1 text-sm font-medium", th.soft, th.text)}>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  {getDomainsBySection(section.id).map((domain) => (
                    <div key={domain.id} className="spot reveal rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-7">
                      <div className="flex items-start gap-4">
                        <Donut value={Math.round(domain.weight * 100)} color={th.ring} />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-bold tracking-tight">{domain.name}</h3>
                          {locale !== "en" && <p className="text-sm text-muted">{t.domains[domain.id]}</p>}
                          <span className={cn("mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", th.soft, th.text)}>
                            {domain.questions} {t.common.questions}
                          </span>
                        </div>
                      </div>
                      <p className="mt-4 text-muted">{domainDescription(domain, locale)}</p>
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {domain.skills.map((rawSkill) => {
                          const skill = localizeSkill(rawSkill, locale);
                          return (
                            <details
                              key={skill.id}
                              className="group rounded-2xl border border-border bg-bg p-4 transition open:border-accent/40 open:bg-accent-soft/30 open:shadow-card"
                            >
                              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                                <span>
                                  <span className="block font-semibold">{skill.displayName}</span>
                                  {locale !== "en" && <span className="block text-xs text-muted">{skill.name}</span>}
                                </span>
                                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition group-open:rotate-180 group-open:bg-accent group-open:text-accent-fg">
                                  <Icon name="chevronDown" className="size-4" />
                                </span>
                              </summary>
                              <p className="mt-3 text-sm text-muted">{skill.summary}</p>
                              <ul className="mt-3 space-y-1.5 text-sm">
                                {skill.strategies.map((st) => (
                                  <li key={st} className="flex gap-2">
                                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-success" />
                                    {st}
                                  </li>
                                ))}
                              </ul>
                              <p className="mt-4 text-xs font-bold tracking-wide text-danger uppercase">{g.traps}</p>
                              <ul className="mt-1.5 space-y-1 text-sm text-muted">
                                {skill.traps.map((tr) => (
                                  <li key={tr} className="flex gap-2">
                                    <Icon name="x" className="mt-0.5 size-4 shrink-0 text-danger" />
                                    {tr}
                                  </li>
                                ))}
                              </ul>
                            </details>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </GuideFold>
            );
          })}

          {/* ================= Ballash ================= */}
          <GuideFold id="scoring" heading={<H2 id="scoring" n={num("scoring")} eyebrow={g.scoring.eyebrow}>{g.scoring.title}</H2>}>
            <p className="leading-relaxed text-muted">{g.scoring.text}</p>
            <ScoreExplorer bands={facts.scoreBands} title={g.explorer.title} hint={g.explorer.hint} percentileLabel={g.scoring.percentile} />
            <p className="text-xs text-muted">{g.scoring.note}</p>
          </GuideFold>

          {/* ================= Ro'yxatdan o'tish ================= */}
          <GuideFold id="registration" heading={<H2 id="registration" n={num("registration")} eyebrow={g.registration.eyebrow}>{g.registration.title}</H2>}>
            <ol className="relative space-y-4">
              <span className="absolute top-6 bottom-6 left-6 w-0.5 bg-gradient-to-b from-accent via-gold to-transparent" aria-hidden />
              {facts.timeline.map((item, i) => (
                <li key={item.title} className="reveal relative flex gap-5">
                  <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent to-[#1e40af] font-display font-bold text-white shadow-[0_0_0_6px_var(--bg),0_10px_24px_-8px_var(--accent)]">
                    {i + 1}
                  </span>
                  <div className="spot flex-1 rounded-2xl border border-border bg-surface p-5 shadow-card transition hover:shadow-lift">
                    <p className="font-bold">{item.title}</p>
                    <p className="mt-1 text-muted">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <a
              href="https://satsuite.collegeboard.org/sat/dates-deadlines"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent hover:text-accent-fg"
            >
              <Icon name="calendar" className="size-4" /> {g.registration.link} ↗
            </a>
          </GuideFold>

          {/* ================= Test kuni ================= */}
          <GuideFold id="test-day" heading={<H2 id="test-day" n={num("test-day")} eyebrow={g.testDay.eyebrow}>{g.testDay.title}</H2>}>
            <Checklist items={facts.checklist} />
          </GuideFold>

          {/* ================= Strategiyalar ================= */}
          <GuideFold id="strategies" heading={<H2 id="strategies" n={num("strategies")} eyebrow={g.strategies.eyebrow}>{g.strategies.title}</H2>}>
            <div className="grid gap-4 sm:grid-cols-2">
              {facts.strategies.map((s, i) => (
                <div
                  key={s.title}
                  className="spot reveal group relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift"
                >
                  <span
                    className="pointer-events-none absolute -right-2 -bottom-6 font-display text-[7rem] leading-none font-extrabold text-accent/[0.06] transition group-hover:text-accent/[0.12]"
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-gradient relative font-display text-3xl font-extrabold">{String(i + 1).padStart(2, "0")}</p>
                  <p className="relative mt-3 font-bold">{s.title}</p>
                  <p className="relative mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
                </div>
              ))}
            </div>
          </GuideFold>

          {/* ================= FAQ ================= */}
          <GuideFold id="faq" heading={<H2 id="faq" n={num("faq")} eyebrow={g.faq.eyebrow}>{g.faq.title}</H2>}>
            <div className="space-y-3">
              {facts.faq.map((item) => (
                <details key={item.q} className="spot reveal group rounded-2xl border border-border bg-surface px-5 py-4 shadow-card transition open:border-accent/40 sm:px-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {item.q}
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition group-open:rotate-45 group-open:bg-accent group-open:text-accent-fg">
                      <span className="text-lg leading-none">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </GuideFold>

          {/* ================= CTA ================= */}
          <div className="reveal relative overflow-hidden rounded-[2rem] bg-ink p-10 text-center text-white sm:p-14">
            <Particles />
            <div className="relative">
              <h2 className="font-display text-4xl font-bold sm:text-5xl">
                <span className="pro-gradient-text">{g.cta.title}</span>
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-white/60">{g.cta.text}</p>
              <a href={localizePath(locale, routes.onboarding)} className="pro-btn mt-8">
                {t.home.heroCta} <Icon name="arrowRight" className="size-4.5" />
              </a>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
