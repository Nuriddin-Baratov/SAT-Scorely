import Link from "next/link";
import type { ReactNode } from "react";

import { domains, sections, totalSkills } from "@/entities/sat";
import { DailyQuestion } from "@/features/daily-question";
import { routes } from "@/shared/config";
import { getDictionary, localizePath, type Locale } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { ButtonLink } from "@/shared/ui/button";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Container, Eyebrow, IconTile, SectionHeading } from "@/shared/ui/primitives";

import { HeroPreview } from "./hero-preview";

const factIcons: IconName[] = ["clock", "layers", "trophy", "compass"];
const stepIcons: { icon: IconName; tone: "accent" | "gold" | "success" }[] = [
  { icon: "user", tone: "accent" },
  { icon: "brain", tone: "gold" },
  { icon: "target", tone: "success" },
];
const phaseColors = ["bg-[#60a5fa]", "bg-[#2563eb]", "bg-[#c58b2c]", "bg-[#15803d]"];

export function HomePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const h = t.home;
  const href = (path: string) => localizePath(locale, path);
  const skills = domains.flatMap((d) =>
    d.skills.map((s) => ({ id: s.id, name: locale === "uz" ? s.nameUz : s.name, section: d.sectionId })),
  );

  const tools: { path: string; icon: IconName; tone: "accent" | "gold" | "success"; title: string; text: string }[] = [
    { path: routes.tests, icon: "pencil", tone: "accent", ...h.tools.items.tests },
    { path: routes.results, icon: "chart", tone: "success", ...h.tools.items.results },
    { path: routes.calculator, icon: "calculator", tone: "gold", ...h.tools.items.calculator },
    { path: routes.practice, icon: "database", tone: "accent", ...h.tools.items.practice },
    { path: routes.mistakes, icon: "refresh", tone: "success", ...h.tools.items.mistakes },
    { path: routes.vocabulary, icon: "cards", tone: "gold", ...h.tools.items.vocabulary },
  ];

  return (
    <main className="flex-1">
      {/* ================= HERO ================= */}
      <section className="px-3 pt-3">
        <div className="noise relative overflow-hidden rounded-[2.25rem] bg-ink text-white">
          <div className="aurora" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="bg-grid-dark pointer-events-none absolute inset-0" aria-hidden />

          <Container className="relative grid items-center gap-16 pt-16 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-28">
            <div className="animate-fade-up">
              <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/85">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#60a5fa] opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#bfdbfe]" />
                </span>
                {h.badge}
              </span>
              <h1 className="mt-7 text-[3.4rem] leading-[0.98] font-bold sm:text-7xl lg:text-[5.4rem]">
                {h.heroTitle}
                <br />
                <span className="text-gradient-light font-serif text-[1.12em] font-normal tracking-normal italic">{h.heroAccent}</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/65">
                {h.heroText1}
                <span className="text-white">{h.heroTextStrong}</span>.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <ButtonLink
                  href={href(routes.onboarding)}
                  size="lg"
                  variant="secondary"
                  className="bg-white text-ink shadow-[0_10px_40px_-10px_rgb(255_255_255/0.5)] hover:opacity-100 hover:brightness-95"
                >
                  {h.heroCta} <Icon name="arrowRight" className="size-4.5" />
                </ButtonLink>
                <ButtonLink href={href(routes.tests)} size="lg" variant="ghost" className="glass text-white hover:bg-white/10">
                  <Icon name="pencil" className="size-4.5" /> {h.heroTests}
                </ButtonLink>
              </div>
              <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
                {[
                  [String(domains.length), h.stats.domains],
                  [String(totalSkills), h.stats.skills],
                  [h.stats.signupValue, h.stats.signup],
                ].map(([v, l]) => (
                  <div key={l}>
                    <dt className="sr-only">{l}</dt>
                    <dd className="font-display text-3xl font-bold">{v}</dd>
                    <dd className="text-sm text-white/50">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <HeroPreview t={h.preview} />
          </Container>

          {/* Ko'nikmalar marquee */}
          <div className="relative border-t border-white/10 py-5 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
            <div className="animate-marquee flex w-max gap-3">
              {[...skills, ...skills].map((s, i) => (
                <span
                  key={`${s.id}-${i}`}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70"
                >
                  <span className={cn("size-1.5 rounded-full", s.section === "rw" ? "bg-[#bfdbfe]" : "bg-[#e3b866]")} />
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAKTLAR ================= */}
      <section className="pt-16">
        <Container className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {h.facts.map((f, i) => (
            <div key={f.label} className="reveal flex flex-col items-start gap-3 rounded-3xl border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:gap-4">
              <IconTile tone={i % 2 ? "gold" : "accent"}>
                <Icon name={factIcons[i]} />
              </IconTile>
              <div className="min-w-0">
                <p className="font-display text-xl font-bold whitespace-nowrap sm:text-[1.7rem]">{f.value}</p>
                <p className="text-sm text-muted">{f.label}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* ================= KUNLIK SAVOL ================= */}
      <section className="pt-24">
        <Container className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-6">
            <SectionHeading eyebrow={h.daily.eyebrow} title={h.daily.title} description={h.daily.description} />
            <ul className="mt-8 space-y-3">
              {(
                [
                  { icon: "flame", text: h.daily.points[0] },
                  { icon: "star", text: h.daily.points[1] },
                  { icon: "refresh", text: h.daily.points[2] },
                ] as const
              ).map((p) => (
                <li key={p.text} className="flex items-center gap-3 text-muted">
                  <IconTile tone="gold" className="size-9 rounded-xl">
                    <Icon name={p.icon} className="size-4" />
                  </IconTile>
                  {p.text}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={href(routes.achievements)} variant="outline">
                <Icon name="medal" className="size-4" /> {t.nav.achievements}
              </ButtonLink>
              <ButtonLink href={href(routes.practice)} variant="ghost">
                {t.nav.practice} <Icon name="arrowRight" className="size-4" />
              </ButtonLink>
            </div>
          </div>
          <DailyQuestion />
        </Container>
      </section>

      {/* ================= QANDAY ISHLAYDI ================= */}
      <section id="how" className="py-28">
        <Container>
          <SectionHeading
            eyebrow={h.how.eyebrow}
            align="center"
            title={
              <>
                {h.how.titleA}
                <span className="font-serif font-normal tracking-normal text-accent italic">{h.how.titleAccent}</span>
                {h.how.titleB}
              </>
            }
            description={h.how.description}
          />
          <div className="relative mt-16 grid gap-5 md:grid-cols-3">
            <div className="absolute top-[3.25rem] right-[16%] left-[16%] hidden h-px border-t border-dashed border-border md:block" aria-hidden />
            {h.how.steps.map((s, i) => (
              <div key={s.title} className="reveal relative rounded-[1.75rem] border border-border bg-surface p-8 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="flex items-center justify-between">
                  <IconTile tone={stepIcons[i].tone} className="size-14 rounded-[1.1rem]">
                    <Icon name={stepIcons[i].icon} className="size-6" />
                  </IconTile>
                  <span className="font-display text-5xl font-extrabold text-surface-2">0{i + 1}</span>
                </div>
                <h3 className="mt-8 text-xl font-bold">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ================= BENTO ================= */}
      <section className="pb-28">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              eyebrow={h.bento.eyebrow}
              title={
                <>
                  {h.bento.titleA}
                  <br />
                  <span className="text-gradient">{h.bento.titleB}</span>
                </>
              }
            />
            <p className="max-w-sm text-muted">{h.bento.summary(domains.length, totalSkills)}</p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-6">
            <BentoCard className="md:col-span-4" icon="chart" title={h.bento.weak.title} text={h.bento.weak.text}>
              <div className="mt-8 space-y-3">
                {(
                  [
                    { id: "advanced-math", v: 92, s: "math" },
                    { id: "craft-structure", v: 78, s: "rw" },
                    { id: "conventions", v: 61, s: "rw" },
                    { id: "algebra", v: 34, s: "math" },
                  ] as const
                ).map((d) => (
                  <div key={d.id} className="flex items-center gap-4">
                    <span className="w-44 shrink-0 truncate text-sm">{t.domains[d.id]}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={cn("h-full rounded-full", d.s === "rw" ? "bg-gradient-to-r from-accent-2 to-accent" : "bg-gradient-to-r from-[#e3b866] to-gold")}
                        style={{ width: `${d.v}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs text-muted tabular-nums">{d.v}%</span>
                  </div>
                ))}
              </div>
            </BentoCard>

            <BentoCard className="md:col-span-2" icon="calendar" title={h.bento.schedule.title} text={h.bento.schedule.text}>
              <div className="mt-8 grid grid-cols-7 gap-1.5">
                {h.weekdays.map((d, i) => (
                  <div
                    key={d}
                    className={cn(
                      "grid aspect-[3/4] place-items-center rounded-xl text-xs font-semibold",
                      [0, 2, 4, 5].includes(i) ? "bg-accent text-white shadow-[0_6px_16px_-6px_var(--accent)]" : "bg-surface-2 text-muted",
                    )}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted">
                {h.bento.schedule.total}
                <strong className="text-fg">{h.bento.schedule.totalStrong}</strong>
              </p>
            </BentoCard>

            <BentoCard className="md:col-span-2" icon="trending" title={h.bento.forecast.title} text={h.bento.forecast.text}>
              <div className="relative mx-auto mt-6 w-44">
                <svg viewBox="0 0 120 66" className="w-full" aria-hidden>
                  <defs>
                    <linearGradient id="gauge" x1="0" x2="1">
                      <stop offset="0" stopColor="#60a5fa" />
                      <stop offset="1" stopColor="#c58b2c" />
                    </linearGradient>
                  </defs>
                  <path d="M10 60a50 50 0 01100 0" fill="none" stroke="var(--surface-2)" strokeWidth="10" strokeLinecap="round" />
                  <path d="M10 60a50 50 0 01100 0" fill="none" stroke="url(#gauge)" strokeWidth="10" strokeLinecap="round" strokeDasharray="157" strokeDashoffset="28" />
                </svg>
                <div className="absolute inset-x-0 bottom-0 text-center">
                  <p className="font-display text-3xl font-bold">+270</p>
                  <p className="text-xs text-muted">{h.bento.forecast.unit}</p>
                </div>
              </div>
            </BentoCard>

            <BentoCard className="md:col-span-2" icon="globe" title={h.bento.english.title} text={h.bento.english.text}>
              <div className="mt-8 flex gap-1.5">
                {["A2", "B1", "B2", "C1", "C2"].map((l, i) => (
                  <span
                    key={l}
                    className={cn(
                      "flex-1 rounded-xl py-3 text-center text-sm font-semibold",
                      i === 2 ? "bg-fg text-bg" : i < 2 ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted",
                    )}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </BentoCard>

            <BentoCard className="md:col-span-2" icon="target" title={h.bento.countdown.title} text={h.bento.countdown.text}>
              <p className="mt-6 font-display text-5xl font-extrabold">
                118 <span className="text-lg font-semibold text-muted">{t.common.days}</span>
              </p>
              <div className="mt-4 flex h-2.5 gap-1 overflow-hidden rounded-full">
                {phaseColors.map((color, i) => (
                  <span key={color} className={cn("h-full rounded-full", color)} style={{ flex: [40, 35, 20, 7][i] }} />
                ))}
              </div>
            </BentoCard>
          </div>
        </Container>
      </section>

      {/* ================= TUZILMA (dark) ================= */}
      <section className="px-3">
        <div className="noise relative overflow-hidden rounded-[2.25rem] bg-ink py-28 text-white">
          <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(45% 50% at 50% 0%, rgb(91 76 245 / 0.35), transparent 70%)" }}
            aria-hidden
          />
          <Container className="relative">
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow className="text-[#bfdbfe]">{h.structure.eyebrow}</Eyebrow>
              <h2 className="mt-4 text-4xl leading-[1.05] font-bold sm:text-[3.4rem]">
                {h.structure.titleA}
                <span className="text-gradient-light font-serif font-normal tracking-normal italic">{h.structure.titleAccent}</span>
              </h2>
              <p className="mt-5 text-lg text-white/60">{h.structure.text}</p>
            </div>

            <div className="mx-auto mt-14 flex max-w-3xl flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <FlowNode title={h.structure.flow.m1} sub={h.structure.flow.m1Sub} />
              <FlowArrow />
              <FlowNode title={h.structure.flow.algo} sub={h.structure.flow.algoSub} highlight />
              <FlowArrow />
              <div className="flex flex-col gap-2">
                <FlowNode title={h.structure.flow.hard} sub={h.structure.flow.hardSub} small />
                <FlowNode title={h.structure.flow.easy} sub={h.structure.flow.easySub} small muted />
              </div>
            </div>

            <div className="mt-16 grid gap-5 lg:grid-cols-2">
              {sections.map((section) => (
                <div key={section.id} className="glass reveal rounded-[1.75rem] p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className={cn("text-xs font-semibold tracking-[0.18em] uppercase", section.id === "rw" ? "text-[#bfdbfe]" : "text-[#e3b866]")}>
                        {t.sections[section.id]}
                      </span>
                      <h3 className="mt-2 text-3xl font-bold">{section.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Stat value={section.questions} label={t.common.questions} />
                      <Stat value={section.minutes} label={t.common.minutes} />
                    </div>
                  </div>
                  <ul className="mt-8 space-y-5">
                    {domains
                      .filter((d) => d.sectionId === section.id)
                      .map((d) => (
                        <li key={d.id}>
                          <div className="flex justify-between gap-4 text-sm">
                            <span className="font-medium">{t.domains[d.id]}</span>
                            <span className="shrink-0 text-white/50">
                              ≈{Math.round(d.weight * 100)}% · {d.questions} {t.common.questions}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-white/10">
                            <div
                              className={cn("h-full rounded-full", section.id === "rw" ? "bg-gradient-to-r from-[#2563eb] to-[#bfdbfe]" : "bg-gradient-to-r from-[#a87a26] to-[#bfdbfe]")}
                              style={{ width: `${(d.weight / 0.35) * 100}%` }}
                            />
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <ButtonLink href={href(routes.satGuide)} variant="ghost" className="glass text-white hover:bg-white/10">
                {h.structure.guide} <Icon name="arrowRight" className="size-4" />
              </ButtonLink>
            </div>
          </Container>
        </div>
      </section>

      {/* ================= METODIKA ================= */}
      <section className="py-28">
        <Container>
          <SectionHeading eyebrow={h.method.eyebrow} title={h.method.title} description={h.method.description} />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {h.method.phases.map((p, i) => (
              <div key={p.name} className="reveal group relative overflow-hidden rounded-[1.75rem] border border-border bg-surface p-7 shadow-card">
                <span className={cn("absolute inset-x-0 top-0 h-1", phaseColors[i])} />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-muted">0{i + 1}</span>
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">{p.share}</span>
                </div>
                <h3 className="mt-10 text-2xl font-bold">{p.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ================= VOSITALAR ================= */}
      <section className="pb-28">
        <Container>
          <SectionHeading eyebrow={h.tools.eyebrow} title={h.tools.title} description={h.tools.description} />
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {tools.map((tool) => (
              <Link
                key={tool.path}
                href={href(tool.path)}
                className="reveal group flex flex-col rounded-[1.75rem] border border-border bg-surface p-7 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <IconTile tone={tool.tone} className="size-14 rounded-[1.1rem]">
                  <Icon name={tool.icon} className="size-6" />
                </IconTile>
                <h3 className="mt-8 text-xl font-bold">{tool.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{tool.text}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  {h.tools.open} <Icon name="arrowRight" className="size-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ================= CTA ================= */}
      <section className="px-3">
        <div className="noise relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#8a3ffc] px-6 py-24 text-center text-white">
          <div className="bg-grid-dark pointer-events-none absolute inset-0" aria-hidden />
          <div className="pointer-events-none absolute -right-20 -bottom-40 size-[28rem] rounded-full bg-[radial-gradient(closest-side,rgb(241_207_139/0.35),transparent)]" aria-hidden />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-4xl leading-tight font-bold sm:text-6xl">
              {h.cta.titleA}
              <span className="font-serif font-normal tracking-normal italic">{h.cta.titleAccent}</span>
              {h.cta.titleB}
            </h2>
            <p className="mt-5 text-lg text-white/75">{h.cta.text}</p>
            <ButtonLink
              href={href(routes.onboarding)}
              size="lg"
              variant="secondary"
              className="mt-10 bg-white text-ink shadow-[0_10px_40px_-10px_rgb(0_0_0/0.4)] hover:opacity-100 hover:brightness-95"
            >
              {h.cta.button} <Icon name="arrowRight" className="size-4.5" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}

function BentoCard({
  className,
  icon,
  title,
  text,
  children,
}: {
  className?: string;
  icon: IconName;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("reveal rounded-[1.75rem] border border-border bg-surface p-7 shadow-card transition duration-300 hover:shadow-lift", className)}>
      <div className="flex items-start gap-4">
        <IconTile>
          <Icon name={icon} />
        </IconTile>
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] px-3.5 py-2 text-center ring-1 ring-white/10">
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="text-[11px] text-white/50">{label}</p>
    </div>
  );
}

function FlowNode({ title, sub, highlight, small, muted }: { title: string; sub: string; highlight?: boolean; small?: boolean; muted?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl px-5 text-center ring-1",
        small ? "py-2.5" : "py-4",
        highlight ? "bg-[#2563eb] ring-[#60a5fa] shadow-[0_10px_30px_-10px_#2563eb]" : "bg-white/[0.05] ring-white/10",
        muted && "opacity-60",
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-white/55">{sub}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <span className="text-white/40" aria-hidden>
      <Icon name="arrowRight" className="size-5 rotate-90 sm:rotate-0" />
    </span>
  );
}
