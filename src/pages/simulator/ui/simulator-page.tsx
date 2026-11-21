import { Simulator } from "@/features/take-test";
import { Container } from "@/shared/ui/primitives";

export function SimulatorPage() {
  return (
    <main className="flex-1">
      <Container className="py-5 sm:py-12">
        <Simulator />
      </Container>
    </main>
  );
}
