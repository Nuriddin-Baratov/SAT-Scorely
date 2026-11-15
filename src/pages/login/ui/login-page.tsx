"use client";

import { AuthForm } from "@/features/auth";
import { useI18n } from "@/shared/i18n";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Container } from "@/shared/ui/primitives";

const perks: IconName[] = ["refresh", "trophy", "bolt", "chart"];

export function LoginPage() {
  const { t } = useI18n();
  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-60" aria-hidden />
      <Container className="relative grid items-center gap-12 py-12 sm:py-20 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">{t.auth.eyebrow}</p>
          <h1 className="mt-4 text-4xl leading-tight font-bold sm:text-5xl">{t.auth.title}</h1>
          <p className="mt-4 max-w-md text-lg text-muted">{t.auth.subtitle}</p>
          <ul className="mt-8 space-y-3">
            {t.auth.perks.map((perk, i) => (
              <li key={perk} className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon name={perks[i]} className="size-4" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>
        <AuthForm />
      </Container>
    </main>
  );
}
