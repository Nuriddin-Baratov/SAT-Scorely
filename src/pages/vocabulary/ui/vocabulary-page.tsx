"use client";

import { Flashcards } from "@/features/vocab-flashcards";
import { useI18n } from "@/shared/i18n";
import { Container, SectionHeading } from "@/shared/ui/primitives";

export function VocabularyPage() {
  const { t } = useI18n();
  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-12 sm:py-16">
        <SectionHeading eyebrow={t.vocab.eyebrow} title={t.vocab.title} description={t.vocab.description} />
        <div className="mt-10">
          <Flashcards />
        </div>
      </Container>
    </main>
  );
}
