"use client";

import { TutorChat } from "@/features/ai-tutor";
import { useI18n } from "@/shared/i18n";
import { Container, Eyebrow } from "@/shared/ui/primitives";

export function TutorPage() {
  const { t } = useI18n();
  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-40" aria-hidden />
      <Container className="relative py-4 sm:py-8">
        {/* Chat ko'proq joy olsin — sarlavha ixcham */}
        <div className="mb-4 hidden sm:mb-6 sm:block">
          <Eyebrow>{t.tutor.eyebrow}</Eyebrow>
          <p className="mt-2 max-w-3xl text-muted">{t.tutor.description}</p>
        </div>
        <h1 className="sr-only">{t.tutor.title}</h1>
        <TutorChat />
      </Container>
    </main>
  );
}
