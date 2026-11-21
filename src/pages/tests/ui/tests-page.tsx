"use client";

import Link from "next/link";

import {
  FINAL_TEST_ID,
  getPracticeTest,
  practiceTests,
  summarizeAttempt,
  testLength,
  useCertificates,
  useTestAttempts,
  type PracticeTest,
} from "@/entities/practice-test";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { ButtonLink } from "@/shared/ui/button";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Badge, Card, Container, IconTile, SectionHeading } from "@/shared/ui/primitives";

const kindStyle: Record<PracticeTest["kind"], { icon: IconName; tone: "accent" | "gold" | "success" }> = {
  rw: { icon: "book", tone: "accent" },
  math: { icon: "calculator", tone: "gold" },
  mixed: { icon: "bolt", tone: "success" },
};

/** Umumiy yakuniy test: o'tilsa sertifikat beriladi. */
function FinalExamCard() {
  const { t, href } = useI18n();
  const f = t.final;
  const attempts = useTestAttempts();
  const certificates = useCertificates();
  const test = getPracticeTest(FINAL_TEST_ID)!;
  const own = attempts?.filter((a) => a.testId === test.id) ?? [];
  const best = own.length ? Math.max(...own.map((a) => Math.round(summarizeAttempt(test, a).accuracy * 100))) : null;
  const cert = certificates?.[0];

  return (
    <div className="relative mt-12 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#f9e3a3] via-[#f5b83d] to-[#9a7cf7] p-[1.5px] shadow-[0_30px_70px_-30px_#f5b83d]">
      <div className="relative overflow-hidden rounded-[calc(2rem-1.5px)] bg-[#0b0f1a] p-7 text-white sm:p-9">
        <span className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full bg-[#f5b83d]/20 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute -bottom-28 left-1/4 size-80 rounded-full bg-[#4a63ec]/25 blur-3xl" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5b83d]/15 px-3 py-1 text-xs font-bold text-[#f3d27a]">
                <Icon name="medal" className="size-3.5" /> {f.badge}
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{f.title}</h2>
            <p className="mt-2 max-w-2xl text-white/65">{f.text}</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <Icon name="list" className="size-4 text-[#f3d27a]" /> {testLength(test)} {t.common.questions}
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="clock" className="size-4 text-[#f3d27a]" /> {test.minutes} {t.common.min}
              </span>
              {best !== null && (
                <span className="flex items-center gap-1.5">
                  <Icon name="trophy" className="size-4 text-[#f3d27a]" /> {f.best(best)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
            <Link
              href={href(routes.test(test.id))}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f9e3a3] via-[#f5b83d] to-[#e0b04a] px-7 font-bold text-[#2b1d03] shadow-[0_12px_30px_-10px_#f5b83d] transition hover:brightness-105"
            >
              {own.length ? f.retry : f.start} <Icon name="arrowRight" className="size-4" />
            </Link>
            {cert && (
              <Link
                href={href(routes.certificate(cert.id))}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 px-6 text-sm font-semibold ring-1 ring-white/20 transition hover:bg-white/15"
              >
                <Icon name="check" className="size-4 text-emerald-300" /> {f.viewCertificate}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TestsPage() {
  const { t, locale, href } = useI18n();
  const attempts = useTestAttempts();

  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-12 sm:py-16">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow={t.tests.eyebrow} title={t.tests.title} description={t.tests.description} />
          <ButtonLink href={href(routes.results)} variant="outline" className="self-start md:self-auto">
            <Icon name="chart" className="size-4" /> {t.tests.allResults}
          </ButtonLink>
        </div>

        <FinalExamCard />

        <Link
          href={href(routes.simulator)}
          className="noise group relative mt-6 block overflow-hidden rounded-[2rem] bg-ink p-7 text-white shadow-lift sm:p-9"
        >
          <div className="aurora opacity-70" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#f1cf8b]">
                <Icon name="monitor" className="size-3.5" /> {t.simulator.badge}
              </span>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{t.simulator.title}</h2>
              <p className="mt-2 text-white/65">{t.simulator.cardText}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-6 py-3 font-semibold text-ink transition group-hover:brightness-95 md:self-center">
              {t.simulator.start} <Icon name="arrowRight" className="size-4 transition group-hover:translate-x-1" />
            </span>
          </div>
        </Link>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {practiceTests.filter((test) => !test.simulation && !test.final).map((test) => {
            const own = attempts?.filter((a) => a.testId === test.id) ?? [];
            const scores = own.map((a) => Math.round(summarizeAttempt(test, a).accuracy * 100));
            const last = scores[0];
            const best = scores.length ? Math.max(...scores) : undefined;
            const style = kindStyle[test.kind];

            return (
              <Card key={test.id} className="group flex flex-col p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="flex items-start justify-between gap-3">
                  <IconTile tone={style.tone} className="size-14 rounded-[1.1rem]">
                    <Icon name={style.icon} className="size-6" />
                  </IconTile>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {test.adaptive && (
                      <Badge tone="warning">
                        <Icon name="bolt" className="size-3" /> {t.adaptive.badge}
                      </Badge>
                    )}
                    <Badge tone={style.tone === "success" ? "success" : style.tone}>{t.tests.section[test.kind]}</Badge>
                  </div>
                </div>
                <h2 className="mt-7 text-xl font-bold">{test.title[locale]}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{test.description[locale]}</p>

                <div className="mt-6 flex gap-4 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <Icon name="list" className="size-4" /> {testLength(test)} {t.common.questions}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="clock" className="size-4" /> {test.minutes} {t.common.min}
                  </span>
                </div>

                <div className="mt-5 min-h-12 rounded-2xl bg-surface-2/70 px-4 py-3 text-sm">
                  {attempts === undefined ? null : last === undefined ? (
                    <span className="text-muted">{t.tests.notTaken}</span>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        {t.tests.lastResult}: <strong>{last}%</strong>
                        <span className="text-muted"> · {t.tests.bestResult}: {best}%</span>
                      </span>
                      <span className="text-xs text-muted">{t.tests.attempts(own.length)}</span>
                    </div>
                  )}
                </div>

                <Link
                  href={href(routes.test(test.id))}
                  className={cn(
                    "mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition",
                    "bg-accent text-accent-fg shadow-[0_8px_24px_-8px_var(--accent)] hover:brightness-110",
                  )}
                >
                  {last === undefined ? t.tests.start : t.tests.retry} <Icon name="arrowRight" className="size-4" />
                </Link>
              </Card>
            );
          })}
        </div>

        <Card className="mt-10 p-7 sm:p-8">
          <h2 className="text-xl font-bold">{t.tests.tipsTitle}</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2">
            {t.tests.tips.map((tip, i) => (
              <li key={tip} className="flex gap-3 text-sm leading-relaxed text-muted">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span>
                <span className="pt-1">{tip}</span>
              </li>
            ))}
          </ol>
        </Card>
      </Container>
    </main>
  );
}
