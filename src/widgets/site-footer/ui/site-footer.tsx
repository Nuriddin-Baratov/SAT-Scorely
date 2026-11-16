"use client";

import Link from "next/link";

import { routes, siteConfig } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { Logo } from "@/shared/ui/logo";
import { Container } from "@/shared/ui/primitives";

export function SiteFooter() {
  const { t, href } = useI18n();
  const platform = [
    { path: routes.onboarding, label: t.footer.plan },
    { path: routes.dashboard, label: t.footer.dashboard },
    { path: routes.tests, label: t.footer.tests },
    { path: routes.simulator, label: t.nav.simulator },
    { path: routes.practice, label: t.nav.practice },
    { path: routes.vocabulary, label: t.nav.vocabulary },
    { path: routes.leaderboard, label: t.nav.leaderboard },
    { path: routes.results, label: t.footer.results },
    { path: routes.calculator, label: t.footer.calculator },
    { path: routes.satGuide, label: t.footer.guide },
  ];

  return (
    <footer className="mt-24 px-3 pb-3">
      <div className="noise relative overflow-hidden rounded-[2.25rem] bg-ink text-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(40% 60% at 0% 0%, rgb(91 76 245 / 0.25), transparent 70%)" }}
          aria-hidden
        />
        <Container className="relative grid gap-12 py-16 sm:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">{t.meta.description}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">{t.footer.platform}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/55">
              {platform.map((item) => (
                <li key={item.path}>
                  <Link className="transition hover:text-white" href={href(item.path)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">{t.footer.sources}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/55">
              <li><a className="transition hover:text-white" href="https://satsuite.collegeboard.org/sat" target="_blank" rel="noreferrer">College Board SAT ↗</a></li>
              <li><a className="transition hover:text-white" href="https://bluebook.collegeboard.org" target="_blank" rel="noreferrer">Bluebook ↗</a></li>
              <li><a className="transition hover:text-white" href="https://www.khanacademy.org/test-prep/digital-sat" target="_blank" rel="noreferrer">Khan Academy ↗</a></li>
            </ul>
          </div>
        </Container>
        <Container className="relative flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row sm:justify-between">
          <span>© {siteConfig.name}</span>
          <span>{t.footer.trademark}</span>
        </Container>
      </div>
    </footer>
  );
}
