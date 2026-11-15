import { OnboardingWizard } from "@/features/onboarding";
import { Container } from "@/shared/ui/primitives";

export function OnboardingPage() {
  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-10 sm:py-16">
        <OnboardingWizard />
      </Container>
    </main>
  );
}
