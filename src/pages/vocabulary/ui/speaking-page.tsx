"use client";

import { SpeakingZone } from "@/features/skill-practice";
import { useI18n } from "@/shared/i18n";
import { Container, SectionHeading } from "@/shared/ui/primitives";

export function SpeakingPage() {
  const { t } = useI18n();
  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-5 sm:py-14">
        <SectionHeading eyebrow={t.speaking.eyebrow} title={t.speaking.title} description={t.speaking.description} />
        <div className="mt-5 sm:mt-10">
          <SpeakingZone />
        </div>
      </Container>
    </main>
  );
}
