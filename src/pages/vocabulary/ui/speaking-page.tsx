"use client";

import { useRouter } from "next/navigation";

import { TUTOR_DRAFT_KEY } from "@/features/ai-tutor";
import { SpeakingZone } from "@/features/skill-practice";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { Container, SectionHeading } from "@/shared/ui/primitives";

export function SpeakingPage() {
  const { t, href } = useI18n();
  const router = useRouter();
  // Nutq matni AI ustozga tayyor savol bo'lib o'tadi
  const askAi = (prompt: string) => {
    try {
      window.sessionStorage.setItem(TUTOR_DRAFT_KEY, prompt);
    } catch {
      // sessionStorage yopiq — baribir o'tamiz
    }
    router.push(href(routes.tutor));
  };
  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-5 sm:py-14">
        <SectionHeading eyebrow={t.speaking.eyebrow} title={t.speaking.title} description={t.speaking.description} />
        <div className="mt-5 sm:mt-10">
          <SpeakingZone onAskAi={askAi} />
        </div>
      </Container>
    </main>
  );
}
