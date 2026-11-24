"use client";

import Link from "next/link";
import type React from "react";

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
import { ButtonLink } from "@/shared/ui/button";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Badge, Container, IconTile } from "@/shared/ui/primitives";

const kindStyle: Record<PracticeTest["kind"], { icon: IconName; tone: "accent" | "gold" | "success" }> = {
  rw: { icon: "book", tone: "accent" },
  math: { icon: "calculator", tone: "gold" },
  mixed: { icon: "bolt", tone: "success" },
};

/** Ajratilgan qator: yakuniy test va simulyator (ko'k blok, bitta qatorga sig'adi) */
function FeaturedRow({
  href,
  icon,
  badge,
  title,
  meta,
  cta,
  extra,
}: {
  href: string;
  icon: IconName;
  badge: string;
  title: string;
  meta: string;
  cta: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-ink text-white shadow-lift">
      <span className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
      <Link prefetch href={href} className="relative flex items-center gap-3.5 p-4 sm:gap-5 sm:p-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/15 sm:size-14">
          <Icon name={icon} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-wide text-white/70 uppercase">{badge}</p>
          <h2 className="truncate text-base font-bold sm:text-xl">{title}</h2>
          <p className="truncate text-xs text-white/70 sm:text-sm">{meta}</p>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink sm:inline-flex">
          {cta} <Icon name="arrowRight" className="size-4" />
        </span>
        <Icon name="arrowRight" className="size-5 shrink-0 sm:hidden" />
      </Link>
      {extra}
    </div>
  );
}

export function TestsPage() {
  const { t, locale, href } = useI18n();
  const f = t.final;
  const attempts = useTestAttempts();
  const certificates = useCertificates();
  const finalTest = getPracticeTest(FINAL_TEST_ID)!;
  const finalOwn = attempts?.filter((a) => a.testId === finalTest.id) ?? [];
  const finalBest = finalOwn.length ? Math.max(...finalOwn.map((a) => Math.round(summarizeAttempt(finalTest, a).accuracy * 100))) : null;
  const cert = certificates?.[0];

  return (
    <main className="flex-1">
      <Container className="space-y-3 py-4 sm:space-y-5 sm:py-10">
        <header className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-4xl">{t.nav.tests}</h1>
            <p className="mt-0.5 line-clamp-1 text-sm text-muted">{t.tests.description}</p>
          </div>
          <ButtonLink href={href(routes.results)} variant="outline" size="sm" className="shrink-0" aria-label={t.tests.allResults}>
            <Icon name="chart" className="size-4" />
            <span className="hidden sm:inline">{t.tests.allResults}</span>
          </ButtonLink>
        </header>

        <div className="grid gap-2.5 sm:gap-4 lg:grid-cols-2">
          <FeaturedRow
            href={href(routes.test(finalTest.id))}
            icon="medal"
            badge={f.badge}
            title={f.title}
            meta={`${testLength(finalTest)} ${t.common.questions} · ${finalTest.minutes} ${t.common.min}${finalBest !== null ? ` · ${f.best(finalBest)}` : ""}`}
            cta={finalOwn.length ? f.retry : f.start}
            extra={
              cert && (
                <Link prefetch
                  href={href(routes.certificate(cert.id))}
                  className="relative flex items-center gap-2 border-t border-white/15 px-4 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/5 sm:px-6"
                >
                  <Icon name="check" className="size-4" /> {f.viewCertificate}
                </Link>
              )
            }
          />
          <FeaturedRow
            href={href(routes.simulator)}
            icon="monitor"
            badge={t.simulator.badge}
            title={t.simulator.title}
            meta={t.simulator.cardText}
            cta={t.simulator.start}
          />
        </div>

        <ul className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
          {practiceTests
            .filter((test) => !test.simulation && !test.final)
            .map((test) => {
              const own = attempts?.filter((a) => a.testId === test.id) ?? [];
              const scores = own.map((a) => Math.round(summarizeAttempt(test, a).accuracy * 100));
              const last = scores[0];
              const style = kindStyle[test.kind];
              return (
                <li key={test.id}>
                  <Link prefetch
                    href={href(routes.test(test.id))}
                    className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-3.5 shadow-card transition active:scale-[0.99] sm:p-5 sm:hover:border-accent/40"
                  >
                    <IconTile tone={style.tone} className="size-11 rounded-xl">
                      <Icon name={style.icon} className="size-5" />
                    </IconTile>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5">
                        <span className="truncate font-semibold">{test.title[locale]}</span>
                        {test.adaptive && <Icon name="bolt" className="size-3.5 shrink-0 text-warning" aria-label={t.adaptive.badge} />}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {t.tests.section[test.kind]} · {testLength(test)} {t.common.questions} · {test.minutes} {t.common.min}
                      </p>
                    </div>
                    {attempts !== undefined && last !== undefined ? (
                      <Badge tone={last >= 80 ? "success" : last >= 50 ? "warning" : "danger"} className="shrink-0 font-bold tabular-nums">
                        {last}%
                      </Badge>
                    ) : (
                      <Badge tone="accent" className="shrink-0">{t.tests.start}</Badge>
                    )}
                  </Link>
                </li>
              );
            })}
        </ul>

        <details className="group rounded-2xl border border-border bg-surface shadow-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold sm:p-5">
            <span className="flex items-center gap-2">
              <Icon name="sparkles" className="size-4 text-accent" /> {t.tests.tipsTitle}
            </span>
            <Icon name="chevronDown" className="size-4 text-muted transition group-open:rotate-180" />
          </summary>
          <ol className="grid gap-3 px-4 pb-4 sm:grid-cols-2 sm:px-5 sm:pb-5">
            {t.tests.tips.map((tip, i) => (
              <li key={tip} className="flex gap-3 text-sm leading-relaxed text-muted">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span>
                <span>{tip}</span>
              </li>
            ))}
          </ol>
        </details>
      </Container>
    </main>
  );
}
