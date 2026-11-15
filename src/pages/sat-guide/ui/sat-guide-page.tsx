import type { ReactNode } from "react";

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
import { ButtonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card, Container, Eyebrow } from "@/shared/ui/primitives";

function H2({ id, eyebrow, children }: { id: string; eyebrow: string; children: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 lg:scroll-mt-6">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">{children}</h2>
    </div>
  );
}

export function SatGuidePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const g = t.guide;
  const facts = getSatFacts(locale);

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

  return (
    <main className="flex-1">
      <section className="px-3 pt-3">
        <div className="noise relative overflow-hidden rounded-[2.25rem] bg-ink text-white">
          <div className="aurora" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="bg-grid-dark pointer-events-none absolute inset-0" aria-hidden />
          <Container className="relative pt-16 pb-20 sm:pb-24 lg:pt-24">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/85">
              <Icon name="book" className="size-3.5 text-[#f1cf8b]" /> {g.badge}
            </span>
            <h1 className="mt-7 max-w-4xl text-5xl leading-[0.98] sm:text-7xl">
              {g.titleA}{" "}
              <span className="text-gradient-light font-serif text-[1.1em] font-normal tracking-normal italic">{g.titleAccent}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/65">{g.subtitle}</p>
            <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {g.heroStats.map(([v, l]) => (
                <div key={l} className="glass rounded-2xl px-4 py-3">
                  <p className="font-display text-xl">{v}</p>
                  <p className="text-xs text-white/50">{l}</p>
                </div>
              ))}
            </div>
          </Container>
        </div>
      </section>

      <Container className="grid gap-14 py-16 lg:grid-cols-[220px_1fr]">
        <nav aria-label={g.tocLabel} className="hidden lg:block">
          <ul className="sticky top-6 space-y-1 border-l border-border text-sm">
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="-ml-px block border-l-2 border-transparent py-2 pl-4 text-muted transition hover:border-accent hover:text-fg">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 space-y-24">
          {/* Umumiy */}
          <section className="space-y-6">
            <H2 id="overview" eyebrow={g.overview.eyebrow}>{g.overview.title}</H2>
            <div className="space-y-4 text-lg leading-relaxed text-muted">
              {g.overview.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {g.overview.cards.map(([a, b]) => (
                <Card key={a} className="p-6">
                  <p className="text-xl font-semibold tracking-tight">{a}</p>
                  <p className="mt-1 text-sm text-muted">{b}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Tuzilma */}
          <section className="space-y-6">
            <H2 id="structure" eyebrow={g.structure.eyebrow}>{g.structure.title}</H2>
            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-border text-xs tracking-wider text-muted uppercase">
                  <tr>
                    {g.structure.columns.map((c) => (
                      <th key={c} className="px-6 py-4 font-medium">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sections.map((s) => (
                    <tr key={s.id}>
                      <td className="px-6 py-4 font-medium">{s.name}</td>
                      <td className="px-6 py-4 text-muted">2 × {s.modules.minutes} {t.common.min}</td>
                      <td className="px-6 py-4 text-muted">{s.questions} (2 × {s.modules.questions})</td>
                      <td className="px-6 py-4 text-muted">{s.minutes} {t.common.min}</td>
                      <td className="px-6 py-4 text-muted">≈{Math.round((s.minutes * 60) / s.questions)} {g.structure.seconds}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface-2/50">
                    <td className="px-6 py-4 font-medium">{g.structure.total}</td>
                    <td className="px-6 py-4 text-muted">{g.structure.fourModules}</td>
                    <td className="px-6 py-4 text-muted">98</td>
                    <td className="px-6 py-4 text-muted">{g.structure.totalTime}</td>
                    <td className="px-6 py-4 text-muted">—</td>
                  </tr>
                </tbody>
              </table>
            </Card>
            <p className="text-sm text-muted">{g.structure.pretest}</p>
          </section>

          {/* Adaptiv */}
          <section className="space-y-6">
            <H2 id="adaptive" eyebrow={g.adaptive.eyebrow}>{g.adaptive.title}</H2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="p-6">
                <p className="text-sm font-semibold text-accent">{t.home.structure.flow.m1}</p>
                <p className="mt-2 text-sm text-muted">{g.adaptive.m1}</p>
              </Card>
              <Card className="flex flex-col justify-center p-6 text-center">
                <p className="text-3xl">⟶</p>
                <p className="mt-2 text-sm text-muted">{g.adaptive.algo}</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm font-semibold text-gold">{t.adaptive.module2}</p>
                <p className="mt-2 text-sm text-muted">{g.adaptive.m2}</p>
              </Card>
            </div>
            <p className="leading-relaxed text-muted">{g.adaptive.takeaway}</p>
          </section>

          {/* Bo'limlar */}
          {sections.map((raw, i) => {
            const section = localizeSection(raw, locale);
            return (
              <section key={section.id} className="space-y-6">
                <H2 id={section.id} eyebrow={`0${4 + i} · ${g.sectionEyebrow}`}>
                  {section.name}
                </H2>
                <p className="text-lg leading-relaxed text-muted">{section.description}</p>
                <ul className="flex flex-wrap gap-2">
                  {section.highlights.map((h) => (
                    <li key={h}>
                      <Badge tone={section.id === "rw" ? "accent" : "gold"} className="px-3 py-1 text-sm">{h}</Badge>
                    </li>
                  ))}
                </ul>
                <div className="space-y-4">
                  {getDomainsBySection(section.id).map((domain) => (
                    <Card key={domain.id} className="p-6 sm:p-8">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-xl font-semibold tracking-tight">{domain.name}</h3>
                          {locale !== "en" && <p className="text-sm text-muted">{t.domains[domain.id]}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Badge>≈{Math.round(domain.weight * 100)}%</Badge>
                          <Badge>{domain.questions} {t.common.questions}</Badge>
                        </div>
                      </div>
                      <p className="mt-4 text-muted">{domainDescription(domain, locale)}</p>
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {domain.skills.map((rawSkill) => {
                          const skill = localizeSkill(rawSkill, locale);
                          return (
                            <details key={skill.id} className="group rounded-2xl border border-border bg-bg p-4 open:bg-surface-2/40">
                              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                                <span>
                                  <span className="block font-medium">{skill.displayName}</span>
                                  {locale !== "en" && <span className="block text-xs text-muted">{skill.name}</span>}
                                </span>
                                <span className="text-muted transition group-open:rotate-45" aria-hidden>+</span>
                              </summary>
                              <p className="mt-3 text-sm text-muted">{skill.summary}</p>
                              <ul className="mt-3 space-y-1.5 text-sm">
                                {skill.strategies.map((st) => (
                                  <li key={st} className="flex gap-2"><span className="text-accent">→</span>{st}</li>
                                ))}
                              </ul>
                              <p className="mt-4 text-xs font-semibold tracking-wide text-danger uppercase">{g.traps}</p>
                              <ul className="mt-1.5 space-y-1 text-sm text-muted">
                                {skill.traps.map((tr) => (
                                  <li key={tr} className="flex gap-2"><span className="text-danger">×</span>{tr}</li>
                                ))}
                              </ul>
                            </details>
                          );
                        })}
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Ballash */}
          <section className="space-y-6">
            <H2 id="scoring" eyebrow={g.scoring.eyebrow}>{g.scoring.title}</H2>
            <p className="leading-relaxed text-muted">{g.scoring.text}</p>
            <div className="space-y-3">
              {facts.scoreBands.map((b, i) => (
                <div key={b.range} className="grid items-center gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-[140px_110px_1fr]">
                  <p className="font-display text-3xl">{b.range}</p>
                  <div>
                    <Badge tone={i === 0 ? "gold" : i < 3 ? "accent" : "neutral"}>{b.label}</Badge>
                    <p className="mt-1 text-xs text-muted">{b.percentile} {g.scoring.percentile}</p>
                  </div>
                  <p className="text-sm text-muted">{b.note}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted">{g.scoring.note}</p>
          </section>

          {/* Ro'yxatdan o'tish */}
          <section className="space-y-6">
            <H2 id="registration" eyebrow={g.registration.eyebrow}>{g.registration.title}</H2>
            <ol className="space-y-4">
              {facts.timeline.map((item, i) => (
                <li key={item.title} className="flex gap-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent">{i + 1}</span>
                  <div className="pt-1.5">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-muted">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <a
              href="https://satsuite.collegeboard.org/sat/dates-deadlines"
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-medium text-accent hover:underline"
            >
              {g.registration.link} ↗
            </a>
          </section>

          {/* Test kuni */}
          <section className="space-y-6">
            <H2 id="test-day" eyebrow={g.testDay.eyebrow}>{g.testDay.title}</H2>
            <Card className="p-6 sm:p-8">
              <ul className="grid gap-3 sm:grid-cols-2">
                {facts.checklist.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-xs text-success">✓</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* Strategiyalar */}
          <section className="space-y-6">
            <H2 id="strategies" eyebrow={g.strategies.eyebrow}>{g.strategies.title}</H2>
            <div className="grid gap-4 sm:grid-cols-2">
              {facts.strategies.map((s, i) => (
                <Card key={s.title} className="p-6">
                  <p className="font-display text-3xl text-accent">{String(i + 1).padStart(2, "0")}</p>
                  <p className="mt-3 font-semibold">{s.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="space-y-6">
            <H2 id="faq" eyebrow={g.faq.eyebrow}>{g.faq.title}</H2>
            <div className="divide-y divide-border rounded-3xl border border-border bg-surface">
              {facts.faq.map((item) => (
                <details key={item.q} className="group px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {item.q}
                    <span className="text-xl text-muted transition group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <Card className="relative overflow-hidden p-10 text-center">
            <div className="glow pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative">
              <h2 className="font-display text-4xl">{g.cta.title}</h2>
              <p className="mt-3 text-muted">{g.cta.text}</p>
              <ButtonLink href={localizePath(locale, routes.onboarding)} size="lg" className="mt-7">
                {t.home.heroCta} <Icon name="arrowRight" className="size-4.5" />
              </ButtonLink>
            </div>
          </Card>
        </article>
      </Container>
    </main>
  );
}
