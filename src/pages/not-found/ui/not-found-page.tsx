"use client";

import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { ButtonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Container } from "@/shared/ui/primitives";

export function NotFoundPage() {
  const { t, href } = useI18n();
  return (
    <main className="relative flex flex-1 items-center">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-24 text-center">
        <p className="font-display text-8xl font-bold text-accent">404</p>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{t.notFound.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">{t.notFound.text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href={href(routes.home)}>
            <Icon name="home" className="size-4" /> {t.nav.home}
          </ButtonLink>
          <ButtonLink href={href(routes.tests)} variant="outline">
            {t.nav.tests}
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
