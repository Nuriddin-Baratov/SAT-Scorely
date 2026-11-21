"use client";

import { QuestionBank } from "@/features/practice-questions";
import { useI18n } from "@/shared/i18n";
import { Container, SectionHeading } from "@/shared/ui/primitives";

export function PracticePage() {
  const { t } = useI18n();
  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-5 sm:py-16">
        <SectionHeading eyebrow={t.practice.eyebrow} title={t.practice.title} description={t.practice.description} />
        <div className="mt-4 sm:mt-10">
          <QuestionBank />
        </div>
      </Container>
    </main>
  );
}
